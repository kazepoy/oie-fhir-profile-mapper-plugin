// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Test de charge k6 des canaux de la démo : exécution du mapper en production,
// pas l'éditeur. Lancer avec tools/load/run.sh (voir README.md).

import http from 'k6/http';
import { check } from 'k6';

const HOTE = __ENV.OIE_HOST || 'oie-app';
const PROFIL = __ENV.PROFIL || 'paliers';
const P95_MS = Number(__ENV.P95_MS || 1000);
const ERREURS_MAX = Number(__ENV.ERREURS_MAX || 0.01);

function exemple(nom) {
  return open(`/examples/${nom}`);
}

// Un canal = un écouteur HTTP de la démo, un message d'exemple et la réponse attendue.
const CANAUX = [
  { nom: 'oru', port: 8081, route: 'oru', fichier: 'oru-r01-labo.er7', type: 'text/plain', ressource: 'Bundle', entrees: 12 },
  { nom: 'patient', port: 8082, route: 'patient', fichier: 'oru-r01-minimal.er7', type: 'text/plain', ressource: 'Patient' },
  { nom: 'labo', port: 8083, route: 'labo', fichier: 'oru-r01-labo.er7', type: 'text/plain', ressource: 'Bundle', entrees: 12 },
  { nom: 'sql-patient', port: 8084, route: 'sql-patient', fichier: 'patient-result-sql.xml', type: 'application/xml', ressource: 'Patient' },
  { nom: 'csv-collection', port: 8086, route: 'csv-patients-collection', fichier: 'patients-metier-10.csv', type: 'text/csv', ressource: 'Bundle', entrees: 10 },
].map((c) => ({ ...c, corps: exemple(c.fichier) }));

// Débits en messages par seconde, tous canaux confondus (répartis à tour de rôle).
const CHAUFFAGE = { executor: 'constant-arrival-rate', rate: 2, timeUnit: '1s', duration: '30s', preAllocatedVUs: 5, maxVUs: 20 };
const PROFILS = {
  rapide: {
    chauffage: { ...CHAUFFAGE, duration: '10s' },
    mesure: { executor: 'constant-arrival-rate', rate: 5, timeUnit: '1s', duration: '30s', startTime: '10s', preAllocatedVUs: 10, maxVUs: 50 },
  },
  paliers: {
    chauffage: CHAUFFAGE,
    mesure: {
      executor: 'ramping-arrival-rate', startRate: 5, timeUnit: '1s', startTime: '30s', preAllocatedVUs: 20, maxVUs: 300,
      stages: [5, 10, 20, 40].flatMap((rate) => [{ target: rate, duration: '10s' }, { target: rate, duration: '60s' }]),
    },
  },
  endurance: {
    chauffage: CHAUFFAGE,
    mesure: {
      executor: 'constant-arrival-rate', rate: Number(__ENV.DEBIT || 10), timeUnit: '1s', startTime: '30s',
      duration: __ENV.DUREE || '30m', preAllocatedVUs: 20, maxVUs: 300,
    },
  },
};
if (!PROFILS[PROFIL]) throw new Error(`PROFIL inconnu : ${PROFIL} (${Object.keys(PROFILS).join(', ')})`);

// Une sous-métrique par canal n'apparaît dans le résumé que si un seuil la cite.
const thresholds = {
  'http_req_failed{scenario:mesure}': [`rate<${ERREURS_MAX}`],
  'http_req_duration{scenario:mesure}': [`p(95)<${P95_MS}`],
  'checks{scenario:mesure}': [`rate>${1 - ERREURS_MAX}`],
};
for (const c of CANAUX) {
  thresholds[`http_req_duration{scenario:mesure,canal:${c.nom}}`] = [`p(95)<${P95_MS}`];
  thresholds[`http_req_failed{scenario:mesure,canal:${c.nom}}`] = [`rate<${ERREURS_MAX}`];
  thresholds[`http_reqs{scenario:mesure,canal:${c.nom}}`] = ['count>0'];
}

export const options = {
  scenarios: PROFILS[PROFIL],
  thresholds,
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
  discardResponseBodies: false,
};

function reponseAttendue(c, res) {
  try {
    const valeur = res.json();
    if (valeur.resourceType !== c.ressource) return false;
    return c.entrees === undefined || (valeur.entry || []).length === c.entrees;
  } catch (e) {
    return false;
  }
}

export default function () {
  const c = CANAUX[__ITER % CANAUX.length];
  const res = http.post(`http://${HOTE}:${c.port}/${c.route}/`, c.corps, {
    headers: { 'Content-Type': `${c.type}; charset=UTF-8` },
    tags: { canal: c.nom, name: c.nom },
    timeout: '60s',
  });
  check(res, {
    'HTTP 200': (r) => r.status === 200,
    'ressource FHIR attendue': (r) => reponseAttendue(c, r),
  }, { canal: c.nom });
}

// Résumé Markdown : contexte, verdict des seuils, puis une ligne par canal.
export function handleSummary(data) {
  const m = data.metrics;
  const ms = (v) => (v === undefined ? '–' : `${Math.round(v)}`);
  const pct = (v) => (v === undefined ? '–' : `${(v * 100).toFixed(2)} %`);
  const duree = (data.state.testRunDurationMs / 1000).toFixed(0);
  // k6 calcule les débits sur toute la durée ; on les ramène à la seule phase de mesure.
  const chauffage = parseInt(PROFILS[PROFIL].chauffage.duration, 10);
  const mesure = data.state.testRunDurationMs / 1000 - chauffage;
  const compte = (c) => (((m[`http_reqs{scenario:mesure,canal:${c}}`] || {}).values || {}).count || 0);
  const echecs = Object.entries(m).flatMap(([nom, v]) =>
    Object.entries(v.thresholds || {}).filter(([, t]) => !t.ok).map(([seuil]) => `${nom} : ${seuil}`));

  const lignes = [
    `# Test de charge – profil ${PROFIL}`,
    '',
    `- Date : ${new Date().toISOString()}`,
    `- Commit : ${__ENV.COMMIT || 'inconnu'}`,
    `- Durée : ${duree} s, dont ${chauffage} s de chauffage exclus des mesures`,
    `- Seuils : p95 < ${P95_MS} ms, erreurs < ${pct(ERREURS_MAX)}`,
    '',
    `## Verdict : ${echecs.length ? 'ÉCHEC' : 'OK'}`,
    '',
    ...(echecs.length ? echecs.map((e) => `- seuil dépassé — ${e}`) : ['Tous les seuils sont respectés.']),
    '',
    '## Par canal (phase de mesure)',
    '',
    '| Canal | Messages | Débit (msg/s) | Moyenne (ms) | Médiane | p95 | p99 | Max | Erreurs HTTP |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
  ];
  for (const c of [...CANAUX.map((x) => x.nom), null]) {
    const tag = c ? `{scenario:mesure,canal:${c}}` : '{scenario:mesure}';
    const d = (m[`http_req_duration${tag}`] || {}).values || {};
    const f = (m[`http_req_failed${tag}`] || {}).values || {};
    const total = c ? compte(c) : CANAUX.reduce((s, x) => s + compte(x.nom), 0);
    lignes.push(`| ${c || '**Total**'} | ${total} | ${(total / mesure).toFixed(1)} | ${ms(d.avg)} | ${ms(d.med)} | ${ms(d['p(95)'])} | ${ms(d['p(99)'])} | ${ms(d.max)} | ${pct(f.rate)} |`);
  }
  const verif = ((m['checks{scenario:mesure}'] || {}).values || {}).rate;
  const abandons = ((m.dropped_iterations || {}).values || {}).count || 0;
  lignes.push('', `- Réponses conformes (HTTP 200 et ressource FHIR attendue) : ${pct(verif)}`);
  lignes.push(`- Messages non envoyés faute d'utilisateurs virtuels disponibles : ${abandons}` +
    (abandons ? ' — le serveur ne suit plus le débit demandé.' : ''));
  lignes.push('', 'Le débit demandé et la latence dans le temps sont dans `rapport.html`.', '');

  const md = lignes.join('\n');
  return { '/reports/resume.md': md, stdout: md + '\n' };
}
