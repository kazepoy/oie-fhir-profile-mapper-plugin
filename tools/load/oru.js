// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Coût de la validation et de la trace sur le canal ORU → Bundle.
// Les variantes (tools/load/oru_variantes.py deploy) sont mesurées l'une après
// l'autre, avec un seul client : le canal traite un message à la fois
// (processingThreads=1), donc la latence est le temps de service et son inverse
// le débit maximal. Lancer avec SCRIPT=oru.js tools/load/run.sh.

import http from 'k6/http';
import { check } from 'k6';

const HOTE = __ENV.OIE_HOST || 'oie-app';
const CHAUFFAGE_S = Number(__ENV.CHAUFFAGE_S || 15);
const MESURE_S = Number(__ENV.MESURE_S || 60);
const CLIENTS = Number(__ENV.CLIENTS || 1);
const MESSAGE = open('/examples/hl7v2/oru-r01-labo.er7');

const VARIANTES = [
  { nom: 'validation+trace', port: 8091, validation: 'oui', trace: 'oui', datatype: 'oui' },
  { nom: 'validation', port: 8092, validation: 'oui', trace: 'non', datatype: 'oui' },
  { nom: 'trace', port: 8093, validation: 'non', trace: 'oui', datatype: 'oui' },
  { nom: 'sans', port: 8094, validation: 'non', trace: 'non', datatype: 'oui' },
  { nom: 'sans-datatype', port: 8095, validation: 'non', trace: 'non', datatype: 'non' },
];
const cle = (v) => v.nom.replace(/[^a-z]/g, '_');

const scenarios = {};
const thresholds = {};
VARIANTES.forEach((v, i) => {
  const debut = i * (CHAUFFAGE_S + MESURE_S);
  const commun = { executor: 'constant-vus', vus: CLIENTS, exec: 'envoyer', env: { PORT: String(v.port) } };
  scenarios[`chauffage_${cle(v)}`] = { ...commun, startTime: `${debut}s`, duration: `${CHAUFFAGE_S}s`, tags: { variante: v.nom, phase: 'chauffage' } };
  scenarios[`mesure_${cle(v)}`] = { ...commun, startTime: `${debut + CHAUFFAGE_S}s`, duration: `${MESURE_S}s`, tags: { variante: v.nom, phase: 'mesure' } };
  const tag = `{phase:mesure,variante:${v.nom}}`;
  thresholds[`http_req_duration${tag}`] = ['max>=0'];
  thresholds[`http_req_failed${tag}`] = ['rate<0.01'];
  thresholds[`http_reqs${tag}`] = ['count>0'];
  thresholds[`checks${tag}`] = ['rate>0.99'];
});

export const options = {
  scenarios,
  thresholds,
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
};

export function envoyer() {
  const res = http.post(`http://${HOTE}:${__ENV.PORT}/oru/`, MESSAGE, {
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
    timeout: '60s',
  });
  check(res, {
    'Bundle transaction de 12 entrées': (r) => {
      try {
        const b = r.json();
        return r.status === 200 && b.resourceType === 'Bundle' && b.type === 'transaction' && b.entry.length === 12;
      } catch (e) {
        return false;
      }
    },
  });
}

export function handleSummary(data) {
  const m = data.metrics;
  const val = (nom, tag) => ((m[`${nom}${tag}`] || {}).values || {});
  const ms = (x) => (x === undefined ? '–' : `${Math.round(x)}`);
  const ref = val('http_req_duration', '{phase:mesure,variante:sans-datatype}').med;

  const lignes = [
    '# Test de charge – ORU vers Bundle : validation et trace',
    '',
    `- Date : ${new Date().toISOString()}`,
    `- Commit : ${__ENV.COMMIT || 'inconnu'}`,
    `- Message : oru-r01-labo.er7 (Bundle transaction de 12 ressources, 7 étapes de mapping)`,
    `- Par variante : ${CHAUFFAGE_S} s de chauffage exclus, puis ${MESURE_S} s de mesure avec ${CLIENTS} client(s)`,
    '',
    '| Variante | Validation mapper | Trace | Validation datatype | Messages | Débit (msg/s) | Médiane (ms) | p95 | p99 | Max | Surcoût médian | Conformes |',
    '|---|:-:|:-:|:-:|---:|---:|---:|---:|---:|---:|---:|---:|',
  ];
  for (const v of VARIANTES) {
    const tag = `{phase:mesure,variante:${v.nom}}`;
    const d = val('http_req_duration', tag);
    const n = val('http_reqs', tag).count || 0;
    const ok = val('checks', tag).rate;
    const surcout = ref === undefined || d.med === undefined ? '–' : `+${Math.round(d.med - ref)} ms`;
    lignes.push(`| ${v.nom} | ${v.validation} | ${v.trace} | ${v.datatype} | ${n} | ${(n / MESURE_S).toFixed(1)} | ${ms(d.med)} | ${ms(d['p(95)'])} | ${ms(d['p(99)'])} | ${ms(d.max)} | ${surcout} | ${ok === undefined ? '–' : `${(ok * 100).toFixed(1)} %`} |`);
  }
  lignes.push('', 'Surcoût médian : écart avec la variante sans aucune validation ni trace (sans-datatype).',
    'Avec un seul client et un canal à un thread, le débit est le débit maximal du canal.', '');
  const md = lignes.join('\n');
  return { '/reports/resume.md': md, stdout: md + '\n' };
}
