# Legal PDF Templates

These are the master PDFs that drive every generated document. **Nothing in this folder ships until Nigerian legal counsel signs off on it.**

## Required templates (Lagos)

| Filename | Stage | Counsel review | Status |
|---|---|---|---|
| `receipt-lagos-v1.pdf` | After payment confirmation | Required | TODO |
| `offer-letter-lagos-v1.pdf` | Stage 2 | Required | TODO |
| `contract-of-sale-lagos-v1.pdf` | Stage 3 | Required | TODO |
| `survey-plan-cover-lagos-v1.pdf` | Stage 4 (cover/wrap only — actual plan uploaded) | Required | TODO |
| `deed-of-assignment-lagos-v1.pdf` | Stage 5 — generated, **wet-ink signed offline** | Required | TODO |

## Field convention

Every template MUST use AcroForm text/checkbox/signature fields named in `snake_case`:

```
seller_name           Buyer side:  buyer_name
seller_address                     buyer_address
seller_email                       buyer_email
seller_phone                       buyer_phone
property_name                      witness_name
property_address                   witness_address
property_size_sqm                  witness_occupation
property_plot_number               witness_signature   (signature field)
purchase_price_ngn                 buyer_signature     (signature field)
purchase_price_words               buyer_initial       (initial field)
effective_date                     payment_reference
governing_law
```

Sign fields are positioned where the participant should sign — the portal stamps the captured PNG into the exact bounding box.

## Version control

- Bumping any field name OR text body = new `v{N+1}` filename. Never edit in place.
- New version requires fresh counsel approval (`templates.approvedByCounsel = true`).
- In-flight deals continue using the version they started with — the portal pins each generated document to its template version.

## Adding a state

To support Delta State or federal templates, duplicate the file with `-delta-v1.pdf` / `-federal-v1.pdf` and set the `governingLaw` field on the template row.
