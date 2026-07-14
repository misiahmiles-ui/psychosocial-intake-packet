import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  canAssignWorkflowSeat,
  includedSeatLimitsForPlan,
  resolveWorkflowAccess,
  type WorkflowSeatAssignment
} from "../lib/access/sharedSuiteRules.ts";
import {
  assertCustomerSeatEligible,
  buildPsychosocialPurchaseRecords
} from "../lib/access/sharedAccountProvisioning.ts";
import {
  assertPsychosocialCheckoutAuthority,
  assertPsychosocialSubscriptionAuthority
} from "../lib/stripe/psychosocialCheckoutAuthority.ts";

const tests = [
  {
    name: "Legitimate Psychosocial purchase prepares only its facility access records",
    run() {
      const records = buildPsychosocialPurchaseRecords({
        checkoutSessionId: "cs_test_approved",
        organizationId: "organization-1",
        stripeSubscriptionId: "sub_test_approved",
        subscriptionStatus: "active",
        upfrontPaidAt: "2026-07-13T00:00:00.000Z",
        userId: "buyer-1"
      });

      assert.equal(records.subscription.plan_code, "psychosocial");
      assert.equal(records.entitlement.product_code, "psychosocial");
      assert.equal(records.entitlement.included_seats, 1);
      assert.equal(records.assignment.product_code, "psychosocial");
      assert.equal(records.assignment.user_id, "buyer-1");
      assert.equal(JSON.stringify(records).includes("nursing"), false);

      assertPsychosocialCheckoutAuthority({
        clientReferenceId: "buyer-1",
        expectedMonthlyPriceId: "price_monthly",
        expectedUpfrontPriceId: "price_upfront",
        lineItems: [
          { priceId: "price_upfront", quantity: 1 },
          { priceId: "price_monthly", quantity: 1 }
        ],
        sessionCustomerId: "cus_approved",
        sessionMetadata: approvedMetadata("buyer-1"),
        subscriptionCustomerId: "cus_approved",
        subscriptionMetadata: approvedMetadata("buyer-1"),
        userId: "buyer-1"
      });

      assertPsychosocialSubscriptionAuthority({
        customerId: "cus_approved",
        expectedMonthlyPriceId: "price_monthly",
        items: [{ priceId: "price_monthly", quantity: 1 }],
        metadata: approvedMetadata("buyer-1"),
        userId: "buyer-1"
      });
    }
  },
  {
    name: "Unapproved Stripe prices and product-owner seat provisioning fail closed",
    run() {
      assert.throws(() =>
        assertCustomerSeatEligible({ profileRole: "owner" })
      );
      assert.throws(() =>
        assertCustomerSeatEligible({
          appMetadata: { owner_access: true },
          profileRole: "buyer"
        })
      );
      assert.throws(() =>
        assertPsychosocialCheckoutAuthority({
          clientReferenceId: "buyer-1",
          expectedMonthlyPriceId: "price_monthly",
          expectedUpfrontPriceId: "price_upfront",
          lineItems: [
            { priceId: "price_wrong", quantity: 1 },
            { priceId: "price_monthly", quantity: 1 }
          ],
          sessionCustomerId: "cus_approved",
          sessionMetadata: approvedMetadata("buyer-1"),
          subscriptionCustomerId: "cus_approved",
          subscriptionMetadata: approvedMetadata("buyer-1"),
          userId: "buyer-1"
        })
      );
    }
  },
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
    name: "Shared database functions are hardened without granting access",
    run() {
      const hardeningPath =
        "supabase/migrations/20260713_shared_access_security_hardening.sql";
      assert.equal(existsSync(hardeningPath), true);
      const hardening = readFileSync(hardeningPath, "utf8").toLowerCase();
      assert.match(hardening, /set search_path = pg_catalog/);
      assert.match(hardening, /handle_new_user_profile/);
      assert.match(hardening, /rls_auto_enable/);
      assert.match(hardening, /from public, anon, authenticated/);
      assert.doesNotMatch(hardening, /insert into/);
      assert.doesNotMatch(hardening, /update public\./);
    }
  },
  {
    name: "Account and billing preparation excludes intake information",
    run() {
      const sourcePaths = [
        "lib/access/sharedSuiteRules.ts",
        "lib/access/sharedAccountProvisioning.ts",
        "lib/stripe/psychosocialCheckoutAuthority.ts",
        "lib/supabase/sharedAccessSync.ts",
        "lib/supabase/sharedSuiteAccess.ts",
        "app/api/auth/signup/route.ts",
        "app/api/stripe/create-checkout-session/route.ts",
        "app/api/stripe/webhook/route.ts",
        "supabase/migrations/20260713_shared_suite_access.sql",
        "supabase/migrations/20260713_shared_access_security_hardening.sql"
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

function approvedMetadata(userId: string) {
  return {
    access_package: "standard_agency_access",
    billing_model: "upfront_plus_monthly",
    plan_code: "psychosocial",
    product_code: "psychosocial",
    supabase_user_id: userId
  };
}

if (failures > 0) {
  process.exitCode = 1;
}
