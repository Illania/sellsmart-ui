import type React from "react";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  UploadCloud,
  Wand2,
} from "lucide-react";

import type { Position } from "../../types";
import { money } from "../../utils/format";
import {
  buildImportPreview,
  guessCsvMapping,
  importFieldLabels,
  mergePreviewRowsIntoPositions,
  optionalImportFields,
  parseCsv,
  requiredImportFields,
  summarizeImport,
  type CsvMapping,
  type ImportField,
  type ImportPreviewRow,
} from "../../utils/csvImport";

type Step = "upload" | "map" | "preview" | "success";

type Props = {
  positions: Position[];
  onImport: (positions: Position[]) => Promise<void>;
  onClose: () => void;
};

const FIELD_HELP: Record<ImportField, string> = {
  ticker: "Stock symbol, for example AAPL, MSFT, VOO.",
  quantity: "Number of shares or units you currently hold.",
  averagePrice: "Your average buy price or average cost per share.",
  purchaseDate: "Optional, useful later for tax and performance tracking.",
  exchange: "Optional, helps with global ticker disambiguation.",
  currency: "Optional, for example USD, MYR, CHF.",
  companyName: "Optional, shown in the portfolio if available.",
  currentPrice: "Optional, SellSmart will refresh prices later.",
  notes: "Optional notes from your broker or spreadsheet.",
};

export function ImportPortfolioModal({ positions, onImport, onClose }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<CsvMapping>({});
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const previewRows = useMemo(
    () => buildImportPreview(rows, mapping),
    [rows, mapping],
  );
  const summary = useMemo(() => summarizeImport(previewRows), [previewRows]);
  const requiredMappedCount = requiredImportFields.filter((field) => mapping[field]).length;
  const canPreview = requiredMappedCount === requiredImportFields.length;
  const validRows = previewRows.filter((row) => row.errors.length === 0);
  const importableRows = validRows;
  const invalidRows = previewRows.filter((row) => row.errors.length > 0);

  const handleFile = async (file?: File) => {
    if (!file) return;

    setError("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseCsv(text);

      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setError("This CSV appears to be empty.");
        return;
      }

      const guessed = guessCsvMapping(parsed.headers);
      setFileName(file.name);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(guessed);
      setStep("map");
    } catch (err) {
      console.error(err);
      setError("Could not read this CSV file.");
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    void handleFile(event.dataTransfer.files[0]);
  };

  const updateMapping = (field: ImportField, value: string) => {
    setMapping((current) => ({
      ...current,
      [field]: value || undefined,
    }));
  };

  const importRows = async () => {
    if (importableRows.length === 0) return;

    setIsImporting(true);
    try {
      const nextPositions = mergePreviewRowsIntoPositions(positions, importableRows);
      await onImport(nextPositions);
      setStep("success");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="modal-backdrop import-backdrop">
      <div className="import-modal" role="dialog" aria-modal="true" aria-label="Import portfolio">
        <div className="modal-header import-modal-header">
          <div>
            <span className="import-kicker"><FileSpreadsheet size={16} /> CSV Import</span>
            <h2>Import Portfolio</h2>
            <p>Upload any CSV, map its columns, preview positions, then import safely.</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <ImportSteps step={step} />

        {step === "upload" && (
          <div className="import-upload-step">
            <label
              className="csv-dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
              <UploadCloud size={42} />
              <strong>Drop CSV here or choose a file</strong>
              <span>Works with Yahoo Finance, Google Sheets, Excel exports, and custom broker files.</span>
            </label>

            {error && <div className="import-error"><AlertTriangle size={16} /> {error}</div>}

            <div className="import-helper-grid">
              <div>
                <strong>Required columns</strong>
                <p>Ticker, quantity, average buy price.</p>
              </div>
              <div>
                <strong>Smart mapping</strong>
                <p>SellSmart will guess columns like Symbol, Shares, Avg Cost, or Purchase Price.</p>
              </div>
            </div>
          </div>
        )}

        {step === "map" && (
          <div className="import-map-step">
            <div className="import-file-summary">
              <div>
                <strong>{fileName}</strong>
                <p>{rows.length} rows · {headers.length} columns detected</p>
              </div>
              <span className="import-pill"><Wand2 size={14} /> Auto-mapped {requiredMappedCount}/{requiredImportFields.length} required fields</span>
            </div>

            <div className="mapper-grid">
              {[...requiredImportFields, ...optionalImportFields].map((field) => {
                const isRequired = requiredImportFields.includes(field);
                const isMapped = Boolean(mapping[field]);

                return (
                  <label key={field} className={`mapper-card ${isMapped ? "mapped" : ""} ${isRequired ? "required" : ""}`}>
                    <div>
                      <strong>{importFieldLabels[field]} {isRequired && <span>*</span>}</strong>
                      <small>{FIELD_HELP[field]}</small>
                    </div>
                    <select value={mapping[field] ?? ""} onChange={(event) => updateMapping(field, event.target.value)}>
                      <option value="">Do not import</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>

            <div className="import-validation-strip">
              {canPreview ? (
                <span className="positive"><CheckCircle2 size={16} /> Required fields are mapped</span>
              ) : (
                <span className="warning"><Info size={16} /> Map ticker, quantity, and average price to continue</span>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setStep("upload")}>
                <ArrowLeft size={16} /> Back
              </button>
              <button type="button" className="primary-button" disabled={!canPreview} onClick={() => setStep("preview")}>
                Preview Import
              </button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="import-preview-step">
            <div className="import-stats-grid">
              <Stat label="Valid positions" value={summary.validRows.toString()} tone="positive" />
              <Stat label="Skipped rows" value={summary.skippedRows.toString()} tone={summary.skippedRows > 0 ? "warning" : "muted"} />
              <Stat label="Rows to merge" value={summary.repeatedTickerRows.toString()} tone={summary.repeatedTickerRows > 0 ? "positive" : "muted"} />
              <Stat label="Imported value" value={money.format(summary.estimatedValue)} tone="muted" />
            </div>

            <div className="import-preview-table-wrap">
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Qty</th>
                    <th>Avg Price</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 12).map((row) => (
                    <PreviewRow key={row.id} row={row} />
                  ))}
                </tbody>
              </table>
            </div>

            {previewRows.length > 12 && (
              <p className="muted-text import-table-note">Showing first 12 rows. All valid rows will be imported.</p>
            )}

            {invalidRows.length > 0 && (
              <div className="import-error soft"><AlertTriangle size={16} /> {invalidRows.length} rows will be skipped because required data is missing.</div>
            )}

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setStep("map")}>
                <ArrowLeft size={16} /> Edit Mapping
              </button>
              <button type="button" className="primary-button" disabled={importableRows.length === 0 || isImporting} onClick={() => void importRows()}>
                {isImporting ? "Importing..." : `Import ${importableRows.length} Positions`}
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="import-success-step">
            <div className="import-success-icon"><CheckCircle2 size={42} /></div>
            <h2>Portfolio imported</h2>
            <p>{importableRows.length} rows were imported and same-ticker rows were merged into your SellSmart portfolio.</p>
            <button type="button" className="primary-button" onClick={onClose}>View Portfolio</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ImportSteps({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "map", label: "Map" },
    { key: "preview", label: "Preview" },
    { key: "success", label: "Done" },
  ];
  const activeIndex = steps.findIndex((item) => item.key === step);

  return (
    <div className="import-steps">
      {steps.map((item, index) => (
        <div key={item.key} className={`import-step ${index <= activeIndex ? "active" : ""}`}>
          <span>{index + 1}</span>
          {item.label}
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "positive" | "warning" | "muted" }) {
  return (
    <div className={`import-stat ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PreviewRow({ row }: { row: ImportPreviewRow }) {
  const hasErrors = row.errors.length > 0;
  const message = hasErrors ? row.errors.join(", ") : row.warnings[0] ?? "Ready";

  return (
    <tr className={hasErrors ? "invalid" : ""}>
      <td><strong>{row.ticker || "—"}</strong></td>
      <td>{row.quantity || "—"}</td>
      <td>{row.averagePrice ? money.format(row.averagePrice) : "—"}</td>
      <td>{row.purchaseDate ?? "—"}</td>
      <td><span className={hasErrors ? "import-row-error" : row.warnings.length ? "import-row-warning" : "import-row-ready"}>{message}</span></td>
    </tr>
  );
}
