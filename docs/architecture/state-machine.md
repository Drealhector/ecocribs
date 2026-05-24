# Deal State Machine

```
                  ┌────────────────────────────────┐
                  │ AWAITING_PAYMENT_CONFIRMATION  │  (initial)
                  └───────────────┬────────────────┘
                                  │ admin records payment
                                  ▼
                  ┌────────────────────────────────┐
                  │         RECEIPT_SENT            │  ← auto-generates receipt PDF
                  └───────────────┬────────────────┘
                                  │ auto on receipt delivery
                                  ▼
                  ┌────────────────────────────────┐
                  │ OFFER_LETTER_AWAITING_CLIENT   │ ──┐ (declines)
                  └───────────────┬────────────────┘   │
                                  │ signs                │
                                  ▼                     ▼
                  ┌────────────────────────────────┐  ┌──────────────────┐
                  │  CONTRACT_AWAITING_CLIENT      │  │  OFFER_DECLINED  │ (soft-terminal)
                  └───────────────┬────────────────┘  └──────────────────┘
                                  │ signs
                                  ▼
                  ┌────────────────────────────────┐
                  │ CONTRACT_AWAITING_WITNESS       │
                  └───────────────┬────────────────┘
                                  │ witness signs
                                  ▼
                  ┌────────────────────────────────┐
                  │       CONTRACT_SIGNED           │
                  └───────────────┬────────────────┘
                                  │ admin uploads endorsed survey
                                  ▼
                  ┌────────────────────────────────┐
                  │        SURVEY_ISSUED            │
                  └───────────────┬────────────────┘
                                  │ auto: generate deed PDF
                                  ▼
                  ┌────────────────────────────────┐
                  │   DEED_AWAITING_CLIENT          │ ──┐ (hybrid path, default)
                  └───────────────┬────────────────┘   │
                  digital path    │                     ▼
                                  │           ┌──────────────────────────┐
                                  │           │  DEED_AWAITING_WET_INK   │
                                  │           └────────────┬─────────────┘
                                  │                        │ wet-signed scan uploaded
                                  │                        ▼
                                  │           ┌──────────────────────────┐
                                  │           │ AWAITING_GOVERNORS_CONSENT│
                                  │           └────────────┬─────────────┘
                                  ▼                        │ consent granted
                  ┌────────────────────────────────┐       │
                  │  DEED_AWAITING_WITNESS          │       │
                  └───────────────┬────────────────┘       │
                                  │                        │
                                  ▼                        │
                  ┌────────────────────────────────┐       │
                  │         DEED_SIGNED             │       │
                  └───────────────┬────────────────┘       │
                                  │                        │
                                  ▼                        │
                  ┌────────────────────────────────┐ ◀─────┘
                  │          COMPLETED              │  (terminal)
                  └───────────────┬────────────────┘
                                  │ +12y retention satisfied
                                  ▼
                  ┌────────────────────────────────┐
                  │          ARCHIVED               │
                  └────────────────────────────────┘
```

## Transition table

Source: `convex/lib/authz.ts::TRANSITIONS`. Any transition not listed here is rejected by `assertValidTransition` and may only be performed as an admin/manager override (which is itself audited with a mandatory reason).
