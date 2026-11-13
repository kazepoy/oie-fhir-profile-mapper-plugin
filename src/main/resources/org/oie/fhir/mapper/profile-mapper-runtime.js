// SPDX-License-Identifier: MPL-2.0
// FHIR Profile Mapper runtime: builds FHIR JSON resources from element paths.
// A path is a list of segments [name] (single element) or [name, item] (an item of a repeating
// element; items with the same key are the same array entry; an iteration adds "*" and the index
// to the key). Repeating elements are collected in FhirArray objects while mapping and become JSON
// arrays in finish(), without the items that got no value, so an empty source field never leaves
// an empty entry, an empty object or a null behind. Decimals are kept as written (1.50) in the
// JSON text and XML the step writes.
(function () {
    var global = this;
    var FhirFacade = Packages.org.oie.fhir.mapper.fhir.FhirFacade;
    // A step preview injects its collector. A deployed message shares one collector between the
    // traced steps of its transformer (state().trace); an untraced step records nothing.
    var preview = typeof __fhirMapperTrace === 'undefined' ? null : __fhirMapperTrace;

    // Active iteration indices, shared by the steps' runtimes: fhirRef belongs to the first one.
    function iterationStack() {
        var s = state();
        return s.iterations || (s.iterations = []);
    }

    function tracer() {
        if (preview) return preview;
        var t = global.__fhirProfileMapper && global.__fhirProfileMapper.trace;
        return t && t.step ? t.collector : null;
    }

    // Finalization and publication belong to the message: traced when any of its steps is.
    function messageTracer() {
        if (preview) return preview;
        var t = global.__fhirProfileMapper && global.__fhirProfileMapper.trace;
        return t ? t.collector : null;
    }

    function capturing() {
        if (preview) return preview.captureValues();
        var t = global.__fhirProfileMapper && global.__fhirProfileMapper.trace;
        return !!(t && t.step && t.capture);
    }

    function started() {
        return tracer() || messageTracer() ? java.lang.System.nanoTime() : 0;
    }

    // Capture scalars only. Never inspect an arbitrary object's getters or call its toString().
    function traceValue(value) {
        var type = value === null ? 'null' : typeof value;
        var out = {type: type};
        var text;
        if (type === 'string' || type === 'number' || type === 'boolean') text = String(value);
        else if (value instanceof Decimal) { out.type = 'decimal'; text = value.text; }
        if (text !== undefined) {
            out.text = text.substring(0, 256);
            out.truncated = text.length > 256;
        }
        return out;
    }

    function record(collector, diagnostic, phase, status, start, value, details, withValue) {
        if (!collector || !collector.isRecording()) return;
        var out = {};
        var t = global.__fhirProfileMapper && global.__fhirProfileMapper.trace;
        if (!preview && t && t.step) out.step = t.step;
        for (var key in (diagnostic || {})) out[key] = diagnostic[key];
        out.phase = phase;
        out.status = status;
        out.durationNanos = Math.max(0, java.lang.System.nanoTime() - start);
        out.iterations = iterationStack().slice();
        if (details) for (var key in details) out[key] = details[key];
        if (withValue && capturing()) out.value = traceValue(value);
        collector.record(JSON.stringify(out));
    }

    // A rule's operation.
    function event(diagnostic, phase, status, start, value, details) {
        if (diagnostic) record(tracer(), diagnostic, phase, status, start, value, details, true);
    }

    // An operation of the traced step that no single rule declares (Bundles, references).
    function stepEvent(phase, status, start, details) {
        var s = global.__fhirProfileMapper;
        var rule = null;
        if (s && s.rule) {
            rule = {};
            for (var key in s.rule) if (key !== 'operation') rule[key] = s.rule[key];
        }
        record(tracer(), rule, phase, status, start, undefined, details, false);
    }

    // Finalization and publication of the message's results.
    function messageEvent(phase, status, start, details) {
        record(messageTracer(), null, phase, status, start, undefined, details, false);
    }

    function saveTrace() {
        var t = global.__fhirProfileMapper && global.__fhirProfileMapper.trace;
        if (t && typeof connectorMap !== 'undefined') connectorMap.put(t.key, String(t.collector.json()));
    }

    function failure(diagnostic, phase, message, cause, start) {
        var context = {};
        for (var key in (diagnostic || {})) context[key] = diagnostic[key];
        context.phase = phase;
        context.errorType = cause.name ? String(cause.name) : null;
        event(diagnostic, phase, 'error', start, undefined, {errorType: context.errorType});
        var result = new Error(message);
        result.fhirMapperDiagnostic = JSON.stringify(context);
        return result;
    }

    function FhirArray(preserveHoles) {
        this.keys = [];
        this.items = {};
        this.preserveHoles = preserveHoles === true;
    }

    // A FHIR decimal with its exact text. Recognized by its mark, not instanceof: every step has
    // its own runtime, and the Bundle carries the decimals of one step to the step that writes it.
    function Decimal(text) {
        this.text = text;
        this.__fhirDecimal = true;
    }

    function isDecimal(value) {
        return value !== null && typeof value === 'object' && value.__fhirDecimal === true;
    }

    function has(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    function isObject(value) {
        return value !== null && typeof value === 'object' && !(value instanceof FhirArray) && !isDecimal(value)
                && Object.prototype.toString.call(value) === '[object Object]';
    }

    function isArray(value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    }

    // Arrays supplied by an object mapping keep their entries when a child or fixed value is added.
    function array(node, name, create) {
        var value = node[name];
        if (value instanceof FhirArray) {
            return value;
        }
        if (!create && !isArray(value)) {
            return undefined;
        }
        // Primitive metadata arrays (_name) must align with the primitive values, including nulls.
        var arr = new FhirArray(name.charAt(0) === '_');
        if (isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                arr.keys.push('#' + i);
                arr.items['#' + i] = value[i];
            }
        }
        node[name] = arr;
        return arr;
    }

    function child(node, seg, create) {
        var name = seg[0];
        if (seg.length < 2) {
            if ((node[name] === undefined || node[name] === null) && create) {
                node[name] = {};
            }
            return node[name];
        }
        var arr = array(node, name, create);
        if (arr === undefined) {
            return undefined;
        }
        if (!has(arr.items, seg[1])) {
            if (!create) {
                return undefined;
            }
            arr.keys.push(seg[1]);
            arr.items[seg[1]] = {};
        }
        return arr.items[seg[1]];
    }

    function get(node, seg) {
        if (seg.length < 2) {
            return node[seg[0]];
        }
        var arr = array(node, seg[0], false);
        return arr !== undefined && has(arr.items, seg[1]) ? arr.items[seg[1]] : undefined;
    }

    function put(node, seg, value) {
        var name = seg[0];
        if (seg.length < 2) {
            node[name] = value;
            return;
        }
        var arr = array(node, name, true);
        if (!has(arr.items, seg[1])) {
            arr.keys.push(seg[1]);
        }
        arr.items[seg[1]] = value;
    }

    function copy(value) {
        if (isDecimal(value)) return new Decimal(value.text);
        if (isArray(value)) {
            var list = [];
            for (var i = 0; i < value.length; i++) {
                list.push(copy(value[i]));
            }
            return list;
        }
        if (isObject(value)) {
            var out = {};
            for (var key in value) {
                if (has(value, key)) {
                    out[key] = copy(value[key]);
                }
            }
            return out;
        }
        return value;
    }

    // Whether an item can take a pattern entry: nothing in it contradicts the pattern.
    function compatible(item, pattern) {
        if (!isObject(item) || !isObject(pattern)) {
            return String(item) === String(pattern);
        }
        for (var key in pattern) {
            if (has(pattern, key) && item[key] !== undefined && item[key] !== null && !(item[key] instanceof FhirArray) && !isArray(item[key])
                    && !compatible(item[key], pattern[key])) {
                return false;
            }
        }
        return true;
    }

    // Fixed and pattern values: added where nothing was mapped, never over a mapped value. Each
    // entry of a pattern on a repeating element goes into the first compatible item, or a new one.
    function merge(target, value) {
        for (var key in value) {
            if (!has(value, key)) {
                continue;
            }
            if (target[key] === undefined || target[key] === null) {
                target[key] = copy(value[key]);
            } else if (isObject(target[key]) && isObject(value[key])) {
                merge(target[key], value[key]);
            } else if (target[key] instanceof FhirArray && isArray(value[key])) {
                var arr = target[key];
                for (var p = 0; p < value[key].length; p++) {
                    var entry = value[key][p];
                    var found = null;
                    for (var i = 0; i < arr.keys.length && found === null; i++) {
                        if (compatible(arr.items[arr.keys[i]], entry)) {
                            found = arr.items[arr.keys[i]];
                        }
                    }
                    if (found !== null && isObject(found) && isObject(entry)) {
                        merge(found, entry);
                    } else if (found === null) {
                        put(target, [key, '#pattern' + p], copy(entry));
                    }
                }
            }
        }
    }

    function pad(n) {
        return (n < 10 ? '0' : '') + n;
    }

    // HL7 v2 DT / TS (YYYY[MM[DD[HH[MM[SS[.S+]]]]]][+/-ZZZZ]) to FHIR date / dateTime / instant.
    // Values already in FHIR form (with '-' in the date) are kept. Without a time zone, the server's
    // (TZ) offset of that date and time is used: FHIR requires one as soon as there is a time.
    var TS = /^(\d{4})(\d{2})?(\d{2})?(?:(\d{2})(\d{2})?(\d{2})?(\.\d+)?)?([+-]\d{4})?$/;

    function dateValue(s, type, element) {
        var m = TS.exec(s);
        if (!m) {
            return s;
        }
        var out = m[1] + (m[2] ? '-' + m[2] + (m[3] ? '-' + m[3] : '') : '');
        if (type === 'date' || !m[4] || !m[3]) {
            if (type === 'instant') {
                throw new Error(element + ': "' + s + '" has no time, which an instant needs.');
            }
            return out;
        }
        var zone = m[8];
        if (zone) {
            zone = zone.substring(0, 3) + ':' + zone.substring(3);
        } else {
            var local = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5] || 0), Number(m[6] || 0));
            var offset = -local.getTimezoneOffset();
            zone = (offset < 0 ? '-' : '+') + pad(Math.floor(Math.abs(offset) / 60)) + ':' + pad(Math.abs(offset) % 60);
        }
        return out + 'T' + m[4] + ':' + (m[5] || '00') + ':' + (m[6] || '00') + (m[7] || '') + zone;
    }

    function timeValue(s) {
        var m = /^(\d{2})(\d{2})?(\d{2})?(\.\d+)?$/.exec(s);
        return m ? m[1] + ':' + (m[2] || '00') + ':' + (m[3] || '00') + (m[4] || '') : s;
    }

    function text(value) {
        if (value === undefined || value === null) {
            return '';
        }
        return String(typeof value === 'xml' ? value.toString() : value).trim();
    }

    // The value of a mapping in the JSON type of the element, or undefined when there is none.
    function convert(value, type, element) {
        if (value === undefined || value === null) {
            return undefined;
        }
        if (typeof value === 'xml') {
            value = value.toString();
        } else if (value instanceof java.lang.String || value instanceof java.lang.Number || value instanceof java.lang.Boolean) {
            value = String(value);
        } else if (isDecimal(value)) {
            return value;
        } else if (typeof value === 'object') {
            return value; // a JavaScript object or array for a complex element, used as it is
        }
        var s = String(value).trim();
        if (s === '') {
            return undefined;
        }
        switch (type) {
            case 'boolean':
                if (/^(true|t|y|yes|1)$/i.test(s)) {
                    return true;
                }
                if (/^(false|f|n|no|0)$/i.test(s)) {
                    return false;
                }
                throw new Error(element + ': "' + s + '" is not a boolean.');
            case 'integer':
            case 'positiveInt':
            case 'unsignedInt':
                if (!/^[+-]?\d+$/.test(s)) {
                    throw new Error(element + ': "' + s + '" is not an integer.');
                }
                return parseInt(s, 10);
            case 'decimal':
                if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(s)) {
                    throw new Error(element + ': "' + s + '" is not a decimal.');
                }
                return new Decimal(s.replace(/^\+/, '').replace(/^(-?)\./, '$10.').replace(/^(-?)0+(?=\d)/, '$1').replace(/\.(?=[eE]|$)/, ''));
            case 'date':
            case 'dateTime':
            case 'instant':
                return dateValue(s, type, element);
            case 'time':
                return timeValue(s);
            default:
                return s;
        }
    }

    function coding(c) {
        var out = {};
        if (c.system) {
            out.system = String(c.system);
        }
        out.code = String(c.code);
        if (c.display) {
            out.display = String(c.display);
        }
        return out;
    }

    // "system|code" or "code" as a coding; a JavaScript object is taken as a coding already.
    function codingOf(value, system) {
        if (value !== null && typeof value === 'object' && typeof value !== 'xml' && !(value instanceof java.lang.String)) {
            return value.code === undefined || value.code === null || String(value.code) === '' ? undefined : value;
        }
        var s = text(value);
        if (s === '') {
            return undefined;
        }
        var bar = s.lastIndexOf('|');
        return bar < 0 ? {system: system, code: s} : {system: s.substring(0, bar), code: s.substring(bar + 1)};
    }

    // ConceptMap/$translate of a source code (on the terminology server, or locally on the
    // ConceptMaps of the profiles without one), as the type of the element: the code for a
    // primitive, the Coding, or a CodeableConcept with that Coding (and the source coding when kept).
    function translateValue(value, translation, type, element, options) {
        var code = text(value);
        if (code === '') {
            return undefined;
        }
        var source = translation.source || '';
        var match = FhirFacade.translate(options.terminologyServer, options.profiles, translation.conceptMap, source, code, translation.target || '',
                options.fhirVersion, options.authorization || '', options.cacheSeconds, options.timeoutSeconds);
        var c;
        if (match !== null && match !== undefined) {
            c = JSON.parse(String(match));
        } else if (translation.unmapped === 'source') {
            c = {system: source, code: code};
        } else if (translation.unmapped === 'fixed') {
            c = codingOf(translation.value, translation.target || '');
        } else if (translation.unmapped === 'function') {
            c = codingOf(translation.fallback(code, source), translation.target || '');
        } else if (translation.unmapped === 'error') {
            throw new Error('FHIR Profile Mapper, ' + element + ': code "' + code + '"' + (source ? ' of ' + source : '') + ' is not in ConceptMap ' + translation.conceptMap + '.');
        } else {
            return undefined;
        }
        if (c === undefined) {
            return undefined;
        }
        if (type === 'Coding') {
            return coding(c);
        }
        if (type === 'CodeableConcept') {
            var codings = [coding(c)];
            if (translation.keepSource && !(String(c.code) === code && String(c.system || '') === source)) {
                codings.push(coding({system: source, code: code}));
            }
            return {coding: codings};
        }
        return String(c.code);
    }

    // The items of an iteration: the nodes of an E4X list, the elements of an array or Java List,
    // or the value itself.
    function items(list) {
        if (list === undefined || list === null) {
            return [];
        }
        var out = [];
        var i;
        if (typeof list === 'xml') {
            for (i = 0; i < list.length(); i++) {
                out.push(list[i]);
            }
        } else if (list instanceof java.util.List) {
            for (i = 0; i < list.size(); i++) {
                out.push(list.get(i));
            }
        } else if (typeof list === 'object' && typeof list.length === 'number') {
            for (i = 0; i < list.length; i++) {
                out.push(list[i]);
            }
        } else {
            out.push(list);
        }
        return out;
    }

    function empty(value) {
        return value === undefined || value === null || (isArray(value) && value.length === 0) || (isObject(value) && Object.keys(value).length === 0);
    }

    // FhirArrays become arrays; empty objects and arrays (an entry that only got nothing) go.
    function finish(value) {
        var i;
        if (value instanceof FhirArray) {
            var list = [];
            for (i = 0; i < value.keys.length; i++) {
                var arrayKey = value.keys[i];
                var item = finish(value.items[arrayKey]);
                var position = value.preserveHoles && /^#\d+$/.test(arrayKey) ? Number(arrayKey.substring(1)) : -1;
                if (position >= 0) {
                    while (list.length < position) list.push(null);
                    list[position] = empty(item) ? null : item;
                } else if (!empty(item)) {
                    list.push(item);
                }
            }
            return list;
        }
        if (isArray(value)) {
            var out = [];
            for (i = 0; i < value.length; i++) {
                var element = finish(value[i]);
                if (!empty(element)) {
                    out.push(element);
                }
            }
            return out;
        }
        if (isObject(value)) {
            for (var key in value) {
                if (has(value, key)) {
                    value[key] = finish(value[key]);
                    if (empty(value[key])) {
                        delete value[key];
                    }
                }
            }
        }
        return value;
    }

    // JSON text with the decimals as written.
    function json(value) {
        if (isDecimal(value)) {
            return value.text;
        }
        if (isArray(value)) {
            var parts = [];
            for (var i = 0; i < value.length; i++) {
                parts.push(json(value[i]));
            }
            return '[' + parts.join(',') + ']';
        }
        if (isObject(value)) {
            var fields = [];
            for (var key in value) {
                if (has(value, key) && value[key] !== undefined) {
                    fields.push(JSON.stringify(key) + ':' + json(value[key]));
                }
            }
            return '{' + fields.join(',') + '}';
        }
        if (value === null || value === undefined) {
            return 'null';
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }
        return JSON.stringify(String(value));
    }

    // A JavaScript object for a JSON template (tmp): decimals become numbers.
    function plain(value) {
        return JSON.parse(json(value));
    }

    // What the steps of one message share: named Bundles and the fullUrls of their resources.
    function state() {
        if (!global.__fhirProfileMapper) {
            global.__fhirProfileMapper = {bundles: Object.create(null), active: [], outputs: []};
        }
        return global.__fhirProfileMapper;
    }

    function namedBundle(name) {
        var b = state().bundles[name];
        if (!b) throw new Error('FHIR Profile Mapper, Bundle ' + name + ': not initialized. Add a Create a Bundle step first.');
        return b;
    }

    function references(name) {
        var active = state().active;
        if (!active.length) throw new Error('FHIR Profile Mapper: select a Bundle to use fhirRef or fhirRefs.');
        var merged = [];
        for (var n = 0; n < active.length; n++) {
            var list = namedBundle(active[n]).refs[name] || [];
            for (var i = 0; i < list.length; i++) {
                if (!list[i]) continue;
                if (merged[i] && merged[i] !== list[i])
                    throw new Error('FHIR Profile Mapper: reference ' + name + '[' + i + '] differs between the selected Bundles. Add the same resource to these Bundles.');
                merged[i] = list[i];
            }
        }
        return merged;
    }

    function uuid() {
        return 'urn:uuid:' + String(java.util.UUID.randomUUID());
    }

    if (typeof global.fhirUuid !== 'function') {
        // A random UUID, e.g. for an id: fhirUuid().
        global.fhirUuid = function () {
            return String(java.util.UUID.randomUUID());
        };
    }
    if (typeof global.fhirRef !== 'function') {
        // The fullUrl (urn:uuid:...) of a resource an earlier FHIR Profile Mapper step added to the
        // Bundle under that reference name; index for a step that made several (0 by default).
        global.fhirRef = function (name, index, reserve) {
            var start = started();
            var list = references(name);
            index = index === undefined ? 0 : Number(index);
            if (index < 0 || index % 1 !== 0) throw new Error('FHIR Profile Mapper: fhirRef index must be a nonnegative integer.');
            var status = list[index] ? 'resolved' : reserve ? 'reserved' : 'missing';
            if (reserve) {
                if (!list[index]) list[index] = uuid();
                var active = state().active;
                for (var n = 0; n < active.length; n++) {
                    var context = namedBundle(active[n]);
                    var target = context.refs[name] || (context.refs[name] = []);
                    target[index] = list[index];
                }
            }
            stepEvent('reference', status, start, {name: String(name), index: index, fullUrl: list[index] || null, bundles: state().active.slice()});
            return list[index];
        };
        // All fullUrls added under a reference name, in order (an empty array for none).
        global.fhirRefs = function (name) {
            return references(name);
        };
    }

    if (typeof global.fhirFind !== 'function') {
        // The first item of a list (E4X list, array) the function holds for, or undefined:
        // fhirFind(msg['PID']['PID.3'], function (cx) { return cx['PID.3.5'] == 'PI'; })['PID.3.1']
        global.fhirFind = function (list, fn) {
            var all = items(list);
            for (var i = 0; i < all.length; i++) {
                if (fn(all[i], i)) {
                    return all[i];
                }
            }
            return undefined;
        };
        // The items of a list the function holds for, as an array (to iterate on).
        global.fhirFilter = function (list, fn) {
            var all = items(list);
            var out = [];
            for (var i = 0; i < all.length; i++) {
                if (fn(all[i], i)) {
                    out.push(all[i]);
                }
            }
            return out;
        };
    }

    // HL7 v2 XML of OIE is flat: the segments of a group are siblings. These find a group's segments.
    function segment(seg) {
        return typeof seg === 'xml' && seg.length() === 1 ? seg[0] : seg;
    }

    function stopsOf(seg, stop) {
        return stop === undefined || stop === null ? [seg.name().toString()] : [].concat(stop);
    }

    if (typeof global.hl7Following !== 'function') {
        // The segments named `name` after `seg`, up to the next segment named in `stop` (default: the
        // name of seg): hl7Following(obr, 'OBX', ['OBR', 'ORC']) is the OBX of an OBR.
        global.hl7Following = function (seg, name, stop) {
            seg = segment(seg);
            var stops = stopsOf(seg, stop);
            var siblings = seg.parent().children();
            var out = [];
            for (var i = seg.childIndex() + 1; i < siblings.length(); i++) {
                var n = siblings[i].name().toString();
                if (stops.indexOf(n) >= 0) {
                    break;
                }
                if (n === name) {
                    out.push(siblings[i]);
                }
            }
            return out;
        };
        // The closest segment named `name` before `seg`, not past a segment named in `stop` (default:
        // the name of seg): hl7Preceding(obr, 'ORC') is the ORC of an OBR; undefined when there is none.
        global.hl7Preceding = function (seg, name, stop) {
            seg = segment(seg);
            var stops = stopsOf(seg, stop);
            var siblings = seg.parent().children();
            for (var i = seg.childIndex() - 1; i >= 0; i--) {
                var n = siblings[i].name().toString();
                if (n === name) {
                    return siblings[i];
                }
                if (stops.indexOf(n) >= 0) {
                    return undefined;
                }
            }
            return undefined;
        };
        // The position (0, 1, ...) of a segment among the segments of its name: hl7Ordinal(obr).
        global.hl7Ordinal = function (seg) {
            seg = segment(seg);
            var siblings = seg.parent().children();
            var name = seg.name().toString();
            var n = 0;
            for (var i = 0; i < seg.childIndex(); i++) {
                if (siblings[i].name().toString() === name) {
                    n++;
                }
            }
            return n;
        };
    }

    return {
        // terminologyServer, profiles, fhirVersion, authorization, cacheSeconds, timeoutSeconds of the step
        options: {},

        // An absent result omits the element; every exception, including TypeError, is an error.
        // translation: null, or {conceptMap, source, target, unmapped, value, keepSource, fallback}.
        set: function (root, path, type, expression, element, translation, diagnostic) {
            var value;
            var start = started();
            var s = state();
            var outer = s.rule;
            s.rule = diagnostic;
            try {
                value = expression();
            } catch (e) {
                throw failure(diagnostic, 'value', 'FHIR Profile Mapper, ' + element + ': ' + e.message, e, start);
            } finally {
                s.rule = outer;
            }
            event(diagnostic, 'value', value === undefined || value === null ? 'absent' : 'success', start, value);
            if (translation) {
                start = started();
                try {
                    value = translateValue(value, translation, type, element, this.options);
                } catch (e) {
                    throw failure(diagnostic, 'translation', 'FHIR Profile Mapper, ' + element + ': ' + e.message, e, start);
                }
                event(diagnostic, 'translation', value === undefined ? 'absent' : 'success', start, value);
            }
            start = started();
            try {
                value = convert(value, type, element);
            } catch (e) {
                throw failure(diagnostic, 'conversion', 'FHIR Profile Mapper, ' + element + ': ' + e.message, e, start);
            }
            event(diagnostic, 'conversion', value === undefined ? 'absent' : 'success', start, value,
                value === undefined ? {reason: 'empty-or-missing'} : null);
            if (value === undefined) {
                return;
            }
            var node = root;
            for (var i = 0; i < path.length - 1; i++) {
                node = child(node, path[i], true);
            }
            put(node, path[path.length - 1], value);
        },

        // A fixed or pattern value, set only when its container (the first `when` segments) got a value.
        fixed: function (root, path, when, value, diagnostic) {
            var start = started();
            var node = root;
            for (var i = 0; i < when; i++) {
                node = child(node, path[i], false);
                if (node === undefined || node === null) {
                    event(diagnostic, 'fixed', 'skipped', start, undefined, {reason: 'container-absent'});
                    return;
                }
            }
            if (when === path.length) {
                if (isObject(node) && isObject(value)) {
                    merge(node, value);
                    event(diagnostic, 'fixed', 'merged', start, value);
                } else {
                    event(diagnostic, 'fixed', 'skipped', start, undefined, {reason: 'incompatible-pattern'});
                }
                return;
            }
            for (var j = when; j < path.length - 1; j++) {
                node = child(node, path[j], true);
            }
            var last = path[path.length - 1];
            var current = get(node, last);
            if (current === undefined || current === null) {
                put(node, last, copy(value));
                event(diagnostic, 'fixed', 'applied', start, value);
            } else if (isObject(current) && isObject(value)) {
                merge(current, value);
                event(diagnostic, 'fixed', 'merged', start, value);
            } else if (current instanceof FhirArray && isArray(value)) {
                var holder = {};
                holder[last[0]] = current;
                merge(holder, (function () {
                    var p = {};
                    p[last[0]] = value;
                    return p;
                })());
                event(diagnostic, 'fixed', 'merged', start, value);
            } else {
                event(diagnostic, 'fixed', 'skipped', start, undefined, {reason: 'already-present'});
            }
        },

        // Whether a condition holds; exceptions are never interpreted as a false condition.
        when: function (expression, element, diagnostic) {
            var start = started();
            try {
                var value = expression();
                event(diagnostic, 'condition', value ? 'passed' : 'skipped', start, value,
                    value ? null : {reason: 'falsey'});
                return !!value;
            } catch (e) {
                throw failure(diagnostic, 'condition', 'FHIR Profile Mapper, condition of ' + element + ': ' + e.message, e, start);
            }
        },

        // Runs body(item, index) for each item of the list the expression gives; nothing when it
        // gives nothing. Exceptions are reported with the iteration's context.
        each: function (expression, body, element, diagnostic) {
            var list;
            var start = started();
            try {
                list = expression();
            } catch (e) {
                throw failure(diagnostic, 'iteration', 'FHIR Profile Mapper, for each ' + element + ': ' + e.message, e, start);
            }
            var all = items(list);
            event(diagnostic, 'iteration', all.length ? 'ready' : 'empty', start, undefined, {count: all.length});
            var tracing = !!tracer();
            for (var i = 0; i < all.length; i++) {
                if (tracing) iterationStack().push({ruleIndex: diagnostic ? diagnostic.ruleIndex : null, index: i});
                try {
                    body(all[i], i);
                } finally {
                    if (tracing) iterationStack().pop();
                }
            }
        },

        finish: finish,
        json: json,
        plain: plain,

        selectBundles: function (names) {
            for (var i = 0; i < names.length; i++) {
                if (namedBundle(names[i]).options.fhirVersion !== this.options.fhirVersion)
                    throw new Error('FHIR Profile Mapper, Bundle ' + names[i] + ': the resource and Bundle use different FHIR versions.');
            }
            state().active = names;
        },

        createBundle: function (name, type, resource, target) {
            var s = state();
            if (s.bundles[name]) throw new Error('FHIR Profile Mapper, Bundle ' + name + ': duplicate Bundle name.');
            for (var other in s.bundles) {
                if (s.bundles[other].target === target)
                    throw new Error('FHIR Profile Mapper, Bundle ' + name + ': output already used by Bundle ' + other + '.');
            }
            if (resource.type && resource.type !== type)
                throw new Error('FHIR Profile Mapper, Bundle ' + name + ': mapped type ' + resource.type + ' conflicts with ' + type + '.');
            if (resource.entry) throw new Error('FHIR Profile Mapper, Bundle ' + name + ': add resources through resource steps, not Bundle.entry mappings.');
            resource.type = type;
            resource.entry = [];
            s.bundles[name] = {resource: resource, target: target, options: this.options, refs: Object.create(null), counts: Object.create(null)};
        },

        stageResource: function (resource, target) {
            state().outputs.push({resource: resource, target: target, options: this.options});
        },

        addToBundles: function (refName, resource, requests) {
            var active = state().active;
            var fullUrl;
            var reserved = false;
            var start = started();
            var i;
            // Reuse a forward reservation made in any selected Bundle, without evaluating the
            // resource mapping again. Different identities under the same name/index are ambiguous.
            for (i = 0; i < active.length; i++) {
                var b = namedBundle(active[i]);
                var index = b.counts[refName] || 0;
                var existing = refName && b.refs[refName] && b.refs[refName][index];
                if (existing && fullUrl && existing !== fullUrl)
                    throw new Error('FHIR Profile Mapper: conflicting reservations for resource ' + refName + '.');
                if (existing) { fullUrl = existing; reserved = true; }
            }
            if (!fullUrl) fullUrl = uuid();
            for (i = 0; i < active.length; i++) {
                var b = namedBundle(active[i]);
                if (refName) {
                    var index = b.counts[refName] || 0;
                    var list = b.refs[refName] || (b.refs[refName] = []);
                    list[index] = fullUrl;
                    b.counts[refName] = index + 1;
                }
                var entry = {fullUrl: fullUrl, resource: copy(resource)};
                if (b.resource.type === 'transaction' || b.resource.type === 'batch') {
                    try { entry.request = requests[i](); }
                    catch (e) { throw new Error('FHIR Profile Mapper, Bundle ' + active[i] + ', resource ' + (refName || resource.resourceType) + ': ' + e.message); }
                }
                b.resource.entry.push(entry);
            }
            stepEvent('bundle-entry', 'added', start, {bundles: active.slice(), resourceType: String(resource.resourceType),
                refName: refName === null || refName === undefined ? null : String(refName), fullUrl: fullUrl, reserved: reserved});
        },

        // Joins this step to its message's trace (info), or leaves it (null).
        traceStep: function (info) {
            var s = state();
            if (!info) {
                if (s.trace) s.trace.step = null;
                return;
            }
            if (!s.trace) {
                var response = typeof global.response !== 'undefined';
                var cm = typeof connectorMessage !== 'undefined' ? connectorMessage : null;
                var id = typeof channelId !== 'undefined' ? String(channelId) : null;
                var revision = id ? Packages.org.oie.fhir.mapper.FhirMapperLifecycle.revision(id) : -1;
                var context = {
                    channel: {id: id, name: typeof channelName !== 'undefined' ? String(channelName) : null, revision: revision >= 0 ? revision : null},
                    connector: {metaDataId: cm ? Number(cm.getMetaDataId()) : null, name: cm && cm.getConnectorName() ? String(cm.getConnectorName()) : null,
                        transformer: response ? 'response' : 'transformer'},
                    messageId: cm ? Number(cm.getMessageId()) : null,
                    serverId: cm && cm.getServerId() ? String(cm.getServerId()) : null
                };
                s.trace = {collector: Packages.org.oie.fhir.mapper.server.FhirMapperTrace.forMessage(JSON.stringify(context)),
                    key: response ? 'fhirMapperResponseTrace' : 'fhirMapperTrace', step: null, capture: false};
            }
            s.trace.collector.step(JSON.stringify(info));
            s.trace.step = info.sequenceNumber;
            s.trace.capture = !!info.captureValues;
            s.trace.started = java.lang.System.nanoTime();
        },

        // Ends a traced step and writes the trace so far: also kept when a later step fails.
        traceEnd: function (failure) {
            var t = state().trace;
            if (!t || !t.step) return;
            stepEvent('step', failure ? 'error' : 'success', t.started,
                failure ? {errorType: failure.name ? String(failure.name) : failure.javaException ? String(failure.javaException.getClass().getSimpleName()) : null} : null);
            t.step = null;
            saveTrace();
        },

        // Called automatically after the last named mapper of this connector. Publish only after
        // every Bundle passed validation, including those whose output is a channel-map variable.
        completeBundles: function () {
            var s = state();
            if (!Object.keys(s.bundles).length && !s.outputs.length) return undefined;
            var output;
            var ready = [];
            var results = s.outputs.slice();
            var started = java.lang.System.nanoTime();
            channelMap.put('__fhirMapperBuildFinishedNano', started);
            channelMap.put('__fhirMapperPhase', 'VALIDATION');
            var phase = 'references';
            var subject = null;
            var step;
            try {
                for (var name in s.bundles) {
                    var b = s.bundles[name];
                    step = java.lang.System.nanoTime();
                    subject = {bundle: name};
                    for (var ref in b.refs) {
                        for (var i = 0; i < b.refs[ref].length; i++) {
                            if (b.refs[ref][i] && i >= (b.counts[ref] || 0))
                                throw new Error('FHIR Profile Mapper, Bundle ' + name + ': unresolved reference ' + ref + '[' + i + '].');
                        }
                    }
                    var urls = Object.create(null);
                    for (var e = 0; e < b.resource.entry.length; e++) urls[b.resource.entry[e].fullUrl] = true;
                    function checkReferences(value, path) {
                        if (!value || typeof value !== 'object' || isDecimal(value)) return;
                        for (var key in value) {
                            if (!has(value, key)) continue;
                            var child = value[key];
                            if (key === 'reference' && typeof child === 'string' && child.indexOf('urn:uuid:') === 0 && !urls[child])
                                throw new Error('FHIR Profile Mapper, Bundle ' + name + ': unresolved local reference at ' + path + '.reference.');
                            checkReferences(child, path + '.' + key);
                        }
                    }
                    checkReferences(b.resource, 'Bundle');
                    messageEvent('references', 'passed', step, {bundle: name, entries: b.resource.entry.length});
                    b.name = name;
                    results.push(b);
                }
                var targets = Object.create(null);
                for (var r = 0; r < results.length; r++) {
                    var b = results[r];
                    var label = b.name ? 'Bundle ' + b.name : b.resource.resourceType;
                    subject = b.name ? {bundle: b.name} : {resourceType: String(b.resource.resourceType)};
                    phase = 'validation';
                    step = java.lang.System.nanoTime();
                    if (has(targets, b.target)) throw new Error('FHIR Profile Mapper, ' + label + ': duplicate output ' + (b.target || 'outbound message') + '.');
                    targets[b.target] = true;
                    var encoded = json(b.resource);
                    if (b.options.validateOutput !== false) {
                        var result = FhirFacade.validate(
                            encoded, b.options.requiredProfile, b.options.profiles, b.options.fhirVersion);
                        if (!result.isValid()) {
                            messageEvent('validation', 'failed', step, subject);
                            subject = null;
                            throw new Error('FHIR Profile Mapper, ' + label + ': ' + result.summary());
                        }
                        messageEvent('validation', 'passed', step, subject);
                    } else {
                        messageEvent('validation', 'skipped', step, {bundle: subject.bundle, resourceType: subject.resourceType, reason: 'disabled'});
                    }
                    ready.push({bundle: b, encoded: encoded, subject: subject});
                }
                // Published only once every result passed: a failure publishes nothing.
                phase = 'publication';
                subject = null;
                for (var n = 0; n < ready.length; n++) {
                    var item = ready[n];
                    step = java.lang.System.nanoTime();
                    if (item.bundle.target) channelMap.put(item.bundle.target, item.encoded);
                    else output = item.bundle.resource;
                    messageEvent('publication', 'published', step, {bundle: item.subject.bundle, resourceType: item.subject.resourceType,
                        target: item.bundle.target ? 'channelMap' : 'outbound-message', variable: item.bundle.target || null});
                }
                return output;
            } catch (e) {
                if (subject) messageEvent(phase, 'error', step, {bundle: subject.bundle, resourceType: subject.resourceType, errorType: e.name ? String(e.name) : null});
                throw e;
            } finally {
                channelMap.put('__fhirMapperValidationNanos', java.lang.System.nanoTime() - started);
                saveTrace();
            }
        },

        // The inbound message as the first FHIR Profile Mapper step of the transformer found it: the
        // expressions of every step see it as msg, also after a step made msg the outbound FHIR.
        source: function (msg) {
            var s = state();
            if (!has(s, 'source')) {
                s.source = msg;
            }
            return s.source;
        },

        // The request of a transaction or batch entry: url and ifNoneExist from expressions.
        request: function (method, resource, url, ifNoneExist) {
            var u = text(url());
            if (u === '') {
                u = method === 'POST' ? resource.resourceType : (resource.id ? resource.resourceType + '/' + resource.id : '');
            }
            if (u === '') {
                throw new Error('FHIR Profile Mapper: a ' + method + ' entry needs a request URL (or an id).');
            }
            var request = {method: method, url: u};
            var none = text(ifNoneExist());
            if (none !== '') {
                request.ifNoneExist = none;
            }
            return request;
        }
    };
})()
