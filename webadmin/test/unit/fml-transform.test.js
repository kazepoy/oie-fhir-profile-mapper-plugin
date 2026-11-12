// Tests of the FHIR FML Transform step registration (web/fml-transform.js).
import test from "node:test";
import assert from "node:assert/strict";
import { register, FML_TYPE } from "../../src/fml/legacy-editor.js";

function platform() {
  const types = new Map();
  return {
    types,
    React: { createElement: () => null },
    oie: { STEP_TYPES: {} },
    registerStepType: (type, definition) => types.set(type, definition)
  };
}

test("registers the step with the defaults of the Java step", () => {
  const p = platform();
  register(p);
  const step = p.types.get(FML_TYPE);
  assert.equal(step.label, "FHIR FML Transform");
  assert.equal(p.oie.STEP_TYPES[FML_TYPE].label, "FHIR FML Transform");
  assert.deepEqual(step.create(), {
    __type: "org.oie.fhir.fml.FhirFmlTransformStep", name: "", enabled: true, fhirVersion: "R4", profiles: "", mapUrl: "",
    variable: "", validateOutput: true, contextVariables: ""
  });
});

test("asks for a map before saving", () => {
  const p = platform();
  register(p);
  const { validate, create } = p.types.get(FML_TYPE);
  assert.equal(validate(create()), "Choose the map to run.");
  assert.equal(validate({ ...create(), mapUrl: "http://example.org/fhir/StructureMap/OruPatient" }), "");
  assert.equal(validate({ ...create(), mapUrl: "http://example.org/m", variable: "  " }), "Give the Channel Map variable a name.");
});
