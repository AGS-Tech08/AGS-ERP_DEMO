import type { ReactNode, CSSProperties } from "react";

export type InvoiceTemplateConfig = {
  show_logo: boolean;
  show_header: boolean;
  show_footer: boolean;
  show_bank_details: boolean;
  show_terms: boolean;
  show_signature: boolean;
  show_tax_columns: boolean;
  show_amount_in_words: boolean;
  footer_text: string;
};

export type InvoiceTemplateData = {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  config?: Partial<InvoiceTemplateConfig>;
  is_default?: boolean;
  is_active?: boolean;
};

export type InvoiceRenderData = {
  company: {
    company_name: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
    pan?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo_path?: string;
    bankAccounts?: Array<{
      bank_name?: string;
      account_holder_name?: string;
      account_number_masked?: string;
      account_number?: string;
      ifsc_code?: string;
      branch?: string;
      upi_id?: string;
    }>;
  };

  sale: {
    invoice_no: string;
    invoice_type?: string;
    gst_type?: "cgst_sgst" | "igst" | null;
    sale_date: string;

    grand_total: number | string;
    subtotal: number | string;
    discount_amount: number | string;
    taxable_amount: number | string;
    gst_amount: number | string;
    other_charges: number | string;

    customer?: {
      company_name?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      gst_number?: string;
      phone?: string;
      mobile?: string;
      email?: string;
    };

    items: Array<{
      description?: string;
      quantity: number | string;
      rate: number | string;
      discount_amount: number | string;
      taxable_amount: number | string;
      gst_percent: number | string;
      gst_amount: number | string;
      total_amount: number | string;

      product?: {
        product_name?: string;
        hsn_code?: string;
        unit?: string;
      };
    }>;
  };
};

const num = (value: number | string | undefined | null) =>
  Number(value ?? 0);

const money = (value: number | string | undefined | null) =>
  num(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const amountInWords = (value: number | string) => {
  const amount = Math.round(num(value));

  if (amount === 0) return "Zero Rupees Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const twoDigit = (n: number): string => {
    if (n < 20) return ones[n];

    return `${tens[Math.floor(n / 10)]}${
      n % 10 ? ` ${ones[n % 10]}` : ""
    }`;
  };

  const threeDigit = (n: number): string => {
    if (n < 100) return twoDigit(n);

    return `${ones[Math.floor(n / 100)]} Hundred${
      n % 100 ? ` ${twoDigit(n % 100)}` : ""
    }`;
  };

  let remaining = amount;
  const parts: string[] = [];

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;

  if (crore) parts.push(`${threeDigit(crore)} Crore`);
  if (lakh) parts.push(`${threeDigit(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigit(thousand)} Thousand`);
  if (remaining) parts.push(threeDigit(remaining));

  return `${parts.join(" ")} Rupees Only`;
};

const paperStyle: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  boxSizing: "border-box",
  background: "#fff",
  color: "#111",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "10px",
  lineHeight: 1.35,
  margin: "0 auto",
  padding: "8mm",
};

const borderCell: CSSProperties = {
  border: "1px solid #111",
  padding: "5px 6px",
  verticalAlign: "top",
};

const headerCell: CSSProperties = {
  ...borderCell,
  background: "#f5f5f5",
  fontWeight: 700,
  textAlign: "center",
};

function getTax(data: InvoiceRenderData) {
  const gst = num(data.sale.gst_amount);

  if (data.sale.gst_type === "cgst_sgst") {
    const cgst = Math.round((gst / 2) * 100) / 100;
    const sgst = Math.round((gst - cgst) * 100) / 100;

    return {
      cgst,
      sgst,
      igst: 0,
      type: "cgst_sgst" as const,
    };
  }

  if (data.sale.gst_type === "igst") {
    return {
      cgst: 0,
      sgst: 0,
      igst: gst,
      type: "igst" as const,
    };
  }

  return {
    cgst: 0,
    sgst: 0,
    igst: 0,
    type: "unknown" as const,
  };
}

function CompanyInfo({
  data,
  showLogo,
}: {
  data: InvoiceRenderData;
  showLogo: boolean;
}) {
  const company = data.company;

  const address = [
    company.address,
    company.city,
    company.state,
    company.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const logoUrl = company.logo_path
    ? company.logo_path.startsWith("http")
      ? company.logo_path
      : `${window.location.origin}${company.logo_path}`
    : "";

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}
    >
      {showLogo && logoUrl && (
        <img
          src={logoUrl}
          alt="Company Logo"
          style={{
            width: 65,
            height: 55,
            objectFit: "contain",
          }}
        />
      )}

      <div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            textTransform: "uppercase",
          }}
        >
          {company.company_name}
        </div>

        {address && <div>{address}</div>}

        <div>
          {company.phone && `Mobile: ${company.phone}`}
          {company.email && ` | Email: ${company.email}`}
        </div>

        <div>
          {company.website && `Web: ${company.website} | `}
          GSTIN: {company.gstin || "-"}
        </div>

        {company.pan && <div>PAN: {company.pan}</div>}
      </div>
    </div>
  );
}

function BuyerInfo({ data }: { data: InvoiceRenderData }) {
  const customer = data.sale.customer;

  const address = [
    customer?.address,
    customer?.city,
    customer?.state,
    customer?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <strong>Invoice To / Buyer</strong>

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          marginTop: 3,
        }}
      >
        {customer?.company_name || "-"}
      </div>

      {address && <div>{address}</div>}

      <div>GSTIN/UIN: {customer?.gst_number || "-"}</div>

      <div>State Name: {customer?.state || "-"}</div>

      <div>
        Mobile: {customer?.mobile || customer?.phone || "-"}
      </div>

      {customer?.email && <div>Email: {customer.email}</div>}
    </div>
  );
}

function ItemsTable({ data }: { data: InvoiceRenderData }) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
      }}
    >
      <thead>
        <tr>
          <th style={{ ...headerCell, width: 30 }}>Sl.</th>
          <th style={{ ...headerCell }}>Description of Goods</th>
          <th style={{ ...headerCell, width: 75 }}>HSN/SAC</th>
          <th style={{ ...headerCell, width: 55 }}>Qty</th>
          <th style={{ ...headerCell, width: 65 }}>Rate</th>
          <th style={{ ...headerCell, width: 55 }}>Disc</th>
          <th style={{ ...headerCell, width: 70 }}>Taxable</th>
          <th style={{ ...headerCell, width: 65 }}>GST</th>
          <th style={{ ...headerCell, width: 80 }}>Amount</th>
        </tr>
      </thead>

      <tbody>
        {data.sale.items.map((item, index) => {
          const name =
            item.product?.product_name ||
            item.description ||
            "Item";

          const unit = item.product?.unit || "";
          const hsn = item.product?.hsn_code || "-";

          return (
            <tr key={`${name}-${index}`}>
              <td style={{ ...borderCell, textAlign: "center" }}>
                {index + 1}
              </td>

              <td style={borderCell}>
                <strong>{name}</strong>
              </td>

              <td
                style={{
                  ...borderCell,
                  textAlign: "center",
                }}
              >
                {hsn}
              </td>

              <td
                style={{
                  ...borderCell,
                  textAlign: "center",
                }}
              >
                {item.quantity} {unit}
              </td>

              <td
                style={{
                  ...borderCell,
                  textAlign: "right",
                }}
              >
                {money(item.rate)}
              </td>

              <td
                style={{
                  ...borderCell,
                  textAlign: "right",
                }}
              >
                {money(item.discount_amount)}
              </td>

              <td
                style={{
                  ...borderCell,
                  textAlign: "right",
                }}
              >
                {money(item.taxable_amount)}
              </td>

              <td
                style={{
                  ...borderCell,
                  textAlign: "center",
                }}
              >
                {num(item.gst_percent)}%
                <br />
                {money(item.gst_amount)}
              </td>

              <td
                style={{
                  ...borderCell,
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {money(item.total_amount)}
              </td>
            </tr>
          );
        })}

        {num(data.sale.other_charges) > 0 && (
          <tr>
            <td style={borderCell}></td>

            <td style={borderCell}>
              <strong>Other / Service Charges</strong>
            </td>

            <td style={borderCell}></td>
            <td style={borderCell}></td>
            <td style={borderCell}></td>
            <td style={borderCell}></td>
            <td style={borderCell}></td>
            <td style={borderCell}></td>

            <td
              style={{
                ...borderCell,
                textAlign: "right",
              }}
            >
              {money(data.sale.other_charges)}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function TaxSummary({ data }: { data: InvoiceRenderData }) {
  const tax = getTax(data);

  const grouped = new Map<
    string,
    {
      taxable: number;
      gst: number;
    }
  >();

  data.sale.items.forEach((item) => {
    const hsn = item.product?.hsn_code || "OTHER";

    const existing = grouped.get(hsn);

    if (existing) {
      existing.taxable += num(item.taxable_amount);
      existing.gst += num(item.gst_amount);
    } else {
      grouped.set(hsn, {
        taxable: num(item.taxable_amount),
        gst: num(item.gst_amount),
      });
    }
  });

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: 8,
      }}
    >
      <thead>
        <tr>
          <th style={headerCell}>HSN/SAC</th>
          <th style={headerCell}>Taxable Value</th>

          {tax.type === "cgst_sgst" && (
            <>
              <th style={headerCell}>CGST</th>
              <th style={headerCell}>SGST</th>
            </>
          )}

          {tax.type === "igst" && (
            <th style={headerCell}>IGST</th>
          )}

          {tax.type === "unknown" && (
            <th style={headerCell}>GST Split</th>
          )}

          <th style={headerCell}>Total Tax</th>
        </tr>
      </thead>

      <tbody>
        {Array.from(grouped.entries()).map(([hsn, row]) => {
          const cgst =
            tax.type === "cgst_sgst"
              ? Math.round((row.gst / 2) * 100) / 100
              : 0;

          const sgst =
            tax.type === "cgst_sgst"
              ? Math.round((row.gst - cgst) * 100) / 100
              : 0;

          return (
            <tr key={hsn}>
              <td style={borderCell}>{hsn}</td>

              <td
                style={{
                  ...borderCell,
                  textAlign: "right",
                }}
              >
                {money(row.taxable)}
              </td>

              {tax.type === "cgst_sgst" && (
                <>
                  <td
                    style={{
                      ...borderCell,
                      textAlign: "right",
                    }}
                  >
                    {money(cgst)}
                  </td>

                  <td
                    style={{
                      ...borderCell,
                      textAlign: "right",
                    }}
                  >
                    {money(sgst)}
                  </td>
                </>
              )}

              {tax.type === "igst" && (
                <td
                  style={{
                    ...borderCell,
                    textAlign: "right",
                  }}
                >
                  {money(row.gst)}
                </td>
              )}

              {tax.type === "unknown" && (
                <td
                  style={{
                    ...borderCell,
                    textAlign: "center",
                  }}
                >
                  Not Available
                </td>
              )}

              <td
                style={{
                  ...borderCell,
                  textAlign: "right",
                }}
              >
                {money(row.gst)}
              </td>
            </tr>
          );
        })}

        <tr>
          <td
            style={{
              ...borderCell,
              fontWeight: 700,
            }}
          >
            Total
          </td>

          <td
            style={{
              ...borderCell,
              textAlign: "right",
              fontWeight: 700,
            }}
          >
            {money(data.sale.taxable_amount)}
          </td>

          {tax.type === "cgst_sgst" && (
            <>
              <td
                style={{
                  ...borderCell,
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {money(tax.cgst)}
              </td>

              <td
                style={{
                  ...borderCell,
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {money(tax.sgst)}
              </td>
            </>
          )}

          {tax.type === "igst" && (
            <td
              style={{
                ...borderCell,
                textAlign: "right",
                fontWeight: 700,
              }}
            >
              {money(tax.igst)}
            </td>
          )}

          {tax.type === "unknown" && (
            <td
              style={{
                ...borderCell,
                textAlign: "center",
              }}
            >
              Not Available
            </td>
          )}

          <td
            style={{
              ...borderCell,
              textAlign: "right",
              fontWeight: 700,
            }}
          >
            {money(data.sale.gst_amount)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function FooterSection({
  data,
  config,
}: {
  data: InvoiceRenderData;
  config: InvoiceTemplateConfig;
}) {
  const bank = data.company.bankAccounts?.[0];

  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          border: "1px solid #111",
        }}
      >
        <div
          style={{
            padding: 7,
            borderRight: "1px solid #111",
            minHeight: 110,
          }}
        >
          {config.show_amount_in_words && (
            <div style={{ marginBottom: 10 }}>
              <strong>Amount Chargeable (in words)</strong>

              <div
                style={{
                  marginTop: 3,
                  fontWeight: 700,
                }}
              >
                {amountInWords(data.sale.grand_total)}
              </div>
            </div>
          )}

          {config.show_terms && (
            <div>
              <strong>Terms and Conditions</strong>

              <ol
                style={{
                  margin: "4px 0 0 16px",
                  padding: 0,
                }}
              >
                <li>Goods once sold will not be taken back.</li>
                <li>
                  Please check quality and quantity before consumption.
                </li>
                <li>
                  Invoice copy is required for warranty claim.
                </li>
              </ol>
            </div>
          )}
        </div>

        <div
          style={{
            padding: 7,
            minHeight: 110,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {config.show_bank_details && (
            <div>
              <strong>Company's Bank Details</strong>

              {bank ? (
                <>
                  <div>
                    Account Number:{" "}
                    {bank.account_number_masked ||
                      bank.account_number ||
                      "-"}
                  </div>

                  <div>
                    Bank: {bank.bank_name || "-"}
                  </div>

                  <div>
                    IFSC: {bank.ifsc_code || "-"}
                  </div>

                  <div>
                    Branch: {bank.branch || "-"}
                  </div>

                  {bank.upi_id && (
                    <div>UPI: {bank.upi_id}</div>
                  )}
                </>
              ) : (
                <div>No bank details available</div>
              )}
            </div>
          )}

          {config.show_signature && (
            <div
              style={{
                marginTop: "auto",
                paddingTop: 25,
                textAlign: "right",
              }}
            >
              <strong>
                For {data.company.company_name}
              </strong>

              <div style={{ height: 35 }} />

              <div>Authorised Signatory</div>
            </div>
          )}
        </div>
      </div>

      {config.show_footer && (
        <div
          style={{
            textAlign: "center",
            fontSize: 8,
            marginTop: 5,
          }}
        >
          {config.footer_text}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TEMPLATE 1
   TALLY PRIME ERP STYLE
========================================================= */

function TallyPrimeTemplate({
  data,
  config,
}: {
  data: InvoiceRenderData;
  config: InvoiceTemplateConfig;
}) {
  const tax = getTax(data);

  return (
    <article style={paperStyle}>
      <div
        style={{
          textAlign: "right",
          fontSize: 8,
        }}
      >
        Original Copy
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 15,
          fontWeight: 800,
          margin: "2px 0 5px",
        }}
      >
        {data.sale.invoice_type === "normal"
          ? "INVOICE"
          : "TAX INVOICE"}
      </div>

      <div style={{ border: "1px solid #111" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 260px",
            borderBottom: "1px solid #111",
          }}
        >
          <div style={{ padding: 7 }}>
            <CompanyInfo
              data={data}
              showLogo={config.show_logo}
            />
          </div>

          <div
            style={{
              borderLeft: "1px solid #111",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
            }}
          >
            <div>
              <div style={borderCell}>
                <strong>Invoice No.</strong>
                <br />
                {data.sale.invoice_no}
              </div>

              <div style={borderCell}>
                <strong>Delivery Note</strong>
                <br />
                -
              </div>

              <div style={borderCell}>
                <strong>Supplier's Ref.</strong>
                <br />
                -
              </div>

              <div style={borderCell}>
                <strong>Buyer's Order No.</strong>
                <br />
                -
              </div>
            </div>

            <div>
              <div style={borderCell}>
                <strong>Dated</strong>
                <br />
                {data.sale.sale_date}
              </div>

              <div style={borderCell}>
                <strong>Mode / Terms</strong>
                <br />
                -
              </div>

              <div style={borderCell}>
                <strong>Other Reference</strong>
                <br />
                -
              </div>

              <div style={borderCell}>
                <strong>Delivery Note Date</strong>
                <br />
                {data.sale.sale_date}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 7,
            minHeight: 90,
            borderBottom: "1px solid #111",
          }}
        >
          <BuyerInfo data={data} />
        </div>

        <ItemsTable data={data} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 220px",
            borderTop: "1px solid #111",
          }}
        >
          <div
            style={{
              ...borderCell,
              minHeight: 90,
            }}
          >
            <strong>Amount Chargeable (in words)</strong>

            <div
              style={{
                marginTop: 5,
                fontWeight: 700,
              }}
            >
              {amountInWords(data.sale.grand_total)}
            </div>
          </div>

          <div style={{ padding: 0 }}>
            <div
              style={{
                ...borderCell,
                textAlign: "right",
              }}
            >
              Subtotal: {money(data.sale.subtotal)}
            </div>

            <div
              style={{
                ...borderCell,
                textAlign: "right",
              }}
            >
              Discount: {money(data.sale.discount_amount)}
            </div>

            <div
              style={{
                ...borderCell,
                textAlign: "right",
              }}
            >
              Taxable: {money(data.sale.taxable_amount)}
            </div>

            {tax.type === "cgst_sgst" && (
              <>
                <div
                  style={{
                    ...borderCell,
                    textAlign: "right",
                  }}
                >
                  CGST: {money(tax.cgst)}
                </div>

                <div
                  style={{
                    ...borderCell,
                    textAlign: "right",
                  }}
                >
                  SGST: {money(tax.sgst)}
                </div>
              </>
            )}

            {tax.type === "igst" && (
              <div
                style={{
                  ...borderCell,
                  textAlign: "right",
                }}
              >
                IGST: {money(tax.igst)}
              </div>
            )}

            <div
              style={{
                ...borderCell,
                textAlign: "right",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Total ₹ {money(data.sale.grand_total)}
            </div>
          </div>
        </div>

        <div style={{ padding: 7 }}>
          <strong>Tax Amount (in words):</strong>{" "}
          {amountInWords(data.sale.gst_amount)}

          <TaxSummary data={data} />
        </div>

        <FooterSection
          data={data}
          config={config}
        />
      </div>
    </article>
  );
}

/* =========================================================
   TEMPLATE 2
   AGS CLASSIC GST STYLE
========================================================= */

function AGSClassicTemplate({
  data,
  config,
}: {
  data: InvoiceRenderData;
  config: InvoiceTemplateConfig;
}) {
  const tax = getTax(data);

  return (
    <article style={paperStyle}>
      <div style={{ border: "1px solid #111" }}>
        <div
          style={{
            textAlign: "right",
            fontSize: 8,
            padding: 3,
            borderBottom: "1px solid #111",
          }}
        >
          Original Copy
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "75px 1fr 150px",
            alignItems: "center",
            padding: 7,
            borderBottom: "1px solid #111",
          }}
        >
          <div>
            {config.show_logo && data.company.logo_path && (
              <img
                src={
                  data.company.logo_path.startsWith("http")
                    ? data.company.logo_path
                    : `${window.location.origin}${data.company.logo_path}`
                }
                alt="Logo"
                style={{
                  width: 60,
                  height: 50,
                  objectFit: "contain",
                }}
              />
            )}
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                color: "#b91c1c",
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              {data.company.company_name}
            </div>

            <div>
              {[
                data.company.address,
                data.company.city,
                data.company.state,
                data.company.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            </div>

            <div>
              Mobile: {data.company.phone || "-"} | Email:{" "}
              {data.company.email || "-"}
            </div>

            <div>
              Web: {data.company.website || "-"} | GSTIN:{" "}
              {data.company.gstin || "-"}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <strong>INVOICE</strong>

            <div>
              No: {data.sale.invoice_no}
            </div>

            <div>
              Date: {data.sale.sale_date}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 180px",
            borderBottom: "1px solid #111",
          }}
        >
          <div style={{ padding: 7 }}>
            <BuyerInfo data={data} />
          </div>

          <div style={{ borderLeft: "1px solid #111" }}>
            <div style={borderCell}>
              <strong>Invoice Number</strong>
              <br />
              {data.sale.invoice_no}
            </div>

            <div style={borderCell}>
              <strong>Invoice Date</strong>
              <br />
              {data.sale.sale_date}
            </div>

            <div style={borderCell}>
              <strong>Place of Supply</strong>
              <br />
              {data.sale.customer?.state || "-"}
            </div>
          </div>
        </div>

        <ItemsTable data={data} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 180px",
            borderTop: "1px solid #111",
          }}
        >
          <div style={borderCell}>
            <strong>Discount</strong>
            <div>
              {money(data.sale.discount_amount)}
            </div>
          </div>

          <div style={{ padding: 0 }}>
            <div
              style={{
                ...borderCell,
                textAlign: "right",
              }}
            >
              Subtotal ₹ {money(data.sale.subtotal)}
            </div>

            <div
              style={{
                ...borderCell,
                textAlign: "right",
              }}
            >
              Taxable ₹ {money(data.sale.taxable_amount)}
            </div>

            {tax.type === "cgst_sgst" && (
              <>
                <div
                  style={{
                    ...borderCell,
                    textAlign: "right",
                  }}
                >
                  CGST ₹ {money(tax.cgst)}
                </div>

                <div
                  style={{
                    ...borderCell,
                    textAlign: "right",
                  }}
                >
                  SGST ₹ {money(tax.sgst)}
                </div>
              </>
            )}

            {tax.type === "igst" && (
              <div
                style={{
                  ...borderCell,
                  textAlign: "right",
                }}
              >
                IGST ₹ {money(tax.igst)}
              </div>
            )}

            <div
              style={{
                ...borderCell,
                textAlign: "right",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Total ₹ {money(data.sale.grand_total)}
            </div>
          </div>
        </div>

        <div style={{ padding: 7 }}>
          <strong>Amount Chargeable (in words)</strong>

          <div style={{ fontWeight: 700 }}>
            {amountInWords(data.sale.grand_total)}
          </div>
        </div>

        <TaxSummary data={data} />

        <FooterSection
          data={data}
          config={config}
        />
      </div>
    </article>
  );
}

/* =========================================================
   TEMPLATE 3
   AGS COMPACT GST STYLE
========================================================= */

function AGSCompactTemplate({
  data,
  config,
}: {
  data: InvoiceRenderData;
  config: InvoiceTemplateConfig;
}) {
  const tax = getTax(data);

  return (
    <article
      style={{
        ...paperStyle,
        fontSize: 9,
        padding: "7mm",
      }}
    >
      <div style={{ border: "1px solid #111" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "65px 1fr 155px",
            alignItems: "center",
            padding: 6,
            borderBottom: "1px solid #111",
          }}
        >
          <div>
            {config.show_logo && data.company.logo_path && (
              <img
                src={
                  data.company.logo_path.startsWith("http")
                    ? data.company.logo_path
                    : `${window.location.origin}${data.company.logo_path}`
                }
                alt="Logo"
                style={{
                  width: 55,
                  height: 45,
                  objectFit: "contain",
                }}
              />
            )}
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                color: "#b91c1c",
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              {data.company.company_name}
            </div>

            <div>
              {[
                data.company.address,
                data.company.city,
                data.company.state,
                data.company.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            </div>

            <div>
              {data.company.phone || "-"} |{" "}
              {data.company.email || "-"}
            </div>

            <div>
              GSTIN: {data.company.gstin || "-"}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              INVOICE
            </div>

            <div>
              No: {data.sale.invoice_no}
            </div>

            <div>
              Date: {data.sale.sale_date}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 6,
            borderBottom: "1px solid #111",
          }}
        >
          <BuyerInfo data={data} />
        </div>

        <ItemsTable data={data} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 180px",
            borderTop: "1px solid #111",
          }}
        >
          <div style={borderCell}>
            <strong>Amount Chargeable</strong>

            <div style={{ fontWeight: 700 }}>
              {amountInWords(data.sale.grand_total)}
            </div>
          </div>

          <div style={{ padding: 0 }}>
            <div
              style={{
                ...borderCell,
                textAlign: "right",
              }}
            >
              Taxable: {money(data.sale.taxable_amount)}
            </div>

            {tax.type === "cgst_sgst" && (
              <>
                <div
                  style={{
                    ...borderCell,
                    textAlign: "right",
                  }}
                >
                  CGST: {money(tax.cgst)}
                </div>

                <div
                  style={{
                    ...borderCell,
                    textAlign: "right",
                  }}
                >
                  SGST: {money(tax.sgst)}
                </div>
              </>
            )}

            {tax.type === "igst" && (
              <div
                style={{
                  ...borderCell,
                  textAlign: "right",
                }}
              >
                IGST: {money(tax.igst)}
              </div>
            )}

            <div
              style={{
                ...borderCell,
                textAlign: "right",
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              Total ₹ {money(data.sale.grand_total)}
            </div>
          </div>
        </div>

        <div style={{ padding: 6 }}>
          <TaxSummary data={data} />
        </div>

        <FooterSection
          data={data}
          config={config}
        />
      </div>
    </article>
  );
}

/* =========================================================
   MAIN RENDERER
========================================================= */

export default function InvoiceTemplateRenderer({
  template,
  data,
  children,
}: {
  template: InvoiceTemplateData;
  data: InvoiceRenderData;
  children?: ReactNode;
}) {
  const config: InvoiceTemplateConfig = {
    show_logo: true,
    show_header: true,
    show_footer: true,
    show_bank_details: true,
    show_terms: true,
    show_signature: true,
    show_tax_columns: true,
    show_amount_in_words: true,
    footer_text: "This is a Computer Generated Invoice",
    ...(template.config || {}),
  };

  const slug = String(template.slug || "").toLowerCase();
  let invoice: ReactNode;

  if (
    slug.includes("tally") ||
    slug.includes("classic-tax") ||
    slug === "classic"
  ) {
    invoice = (
      <TallyPrimeTemplate
        data={data}
        config={config}
      />
    );
  } else if (
    slug.includes("modern") ||
    slug.includes("ags-classic")
  ) {
    invoice = (
      <AGSClassicTemplate
        data={data}
        config={config}
      />
    );
  } else {
    invoice = (
      <AGSCompactTemplate
        data={data}
        config={config}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        background: "#e5e7eb",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      {invoice}

      {children}

      <style>
        {`
          @media print {
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            body * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            @page {
              size: A4;
              margin: 0;
            }

            .invoice-paper {
              page-break-after: auto;
            }
          }

          @media screen {
            .invoice-paper {
              box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            }
          }
        `}
      </style>
    </div>
  );
}