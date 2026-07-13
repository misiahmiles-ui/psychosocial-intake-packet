import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  canAssignWorkflowSeat,
  includedSeatLimitsForPlan,
  resolveWorkflowAccess,
  type WorkflowSeatAssignment
} from "../lib/access/sharedSuiteRules.ts";

const tests = [
  {
    name: "Psychosocial-only access",
    run() {
      const assignments: WorkflowSeatAssignment[] = [
        { productCode: "psychosocial", userId: "psych-staff" }
      ];
      assert.deepEqual(includedSeatLimitsForPlan("psychosocial"), {
        nursing: 0,
        psychosocial: 1
      });
      assert.deepEqual(
        resolveWorkflowAccess({
          assignments,
          isProductOwner: false,
          subscriptionStatus: "active",
          userId: "psych-staff"
        }),
        { nursing: false, psychosocial: true }
      );
    }
  },
  {
    name: "Nursing-only access",
    run() {
      const assignments: WorkflowSeatAssignment[] = [
        { productCode: "nursing", userId: "nursing-staff" }
      ];
      assert.deepEqual(includedSeatLimitsForPlan("nursing"), {
        nursing: 1,
        psychosocial: 0
      });
      assert.deepEqual(
        resolveWorkflowAccess({
          assignments,
          isProductOwner: false,
          subscriptionStatus: "active",
          userId: "nursing-staff"
        }),
        { nursing: true, psychosocial: false }
      );
    }
  },
  {
    name: "Suite access and one employee assigned to both workflows",
    run() {
      const assignments: WorkflowSeatAssignment[] = [
        { productCode: "psychosocial", userId: "suite-staff" },
        { productCode: "nursing", userId: "suite-staff" }
      ];
      assert.deepEqual(includedSeatLimitsForPlan("complete_suite"), {
        nursing: 1,
        psychosocial: 1
      });
      assert.deepEqual(
        resolveWorkflowAccess({
          assignments,
          isProductOwner: false,
          subscriptionStatus: "active",
          userId: "suite-staff"
        }),
        { nursing: true, psychosocial: true }
      );
    }
  },
  {
    name: "Assignments above each paid workflow limit are prevented",
    run() {
      const assignments: WorkflowSeatAssignment[] = [
        { productCode: "psychosocial", userId: "psych-staff" },
        { productCode: "nursing", userId: "nursing-staff" }
      ];
      const seatLimits = includedSeatLimitsForPlan("complete_suite");
      assert.equal(
        canAssignWorkflowSeat({
          assignments,
          productCode: "psychosocial",
          seatLimits,
          userId: "second-psych-staff"
        }),
        false
      );
      assert.equal(
        canAssignWorkflowSeat({
          assignments,
          productCode: "nursing",
          seatLimits,
          userId: "second-nursing-staff"
        }),
        false
      );
    }
  },
  {
    name: "Product-owner access remains separate from customer seats",
    run() {
      assert.deepEqual(
        resolveWorkflowAccess({
          assignments: [],
          isProductOwner: true,
          subscriptionStatus: null,
          userId: "product-owner"
        }),
        { nursing: true, psychosocial: true }
      );
      assert.equal(
        canAssignWorkflowSeat({
          assignments: [],
          productCode: "nursing",
          seatLimits: { nursing: 1, psychosocial: 1 },
          userId: "customer-staff"
        }),
        true
      );
    }
  },
  {
    name: "Account and billing preparation excludes intake information",
    run() {
      const sourcePaths = [
        "lib/access/sharedSuiteRules.ts",
        "lib/supabase/sharedSuiteAccess.ts",
        "supabase/migrations/20260713_shared_suite_access.sql"
      ].filter(existsSync);
      const source = sourcePaths
        .map((path) => readFileSync(path, "utf8").toLowerCase())
        .join("\n");
      const prohibitedFields = [
        "participant_id",
        "participant_name",
        "client_id",
        "client_name",
        "intake_data",
        "intake_response",
        "assessment_data",
        "medical_history",
        "medications",
        "diagnoses"
      ];

      for (const prohibitedField of prohibitedFields) {
        assert.equal(source.includes(prohibitedField), false, prohibitedField);
      }
    }
  }
];

let failures = 0;

for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${test.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
}
