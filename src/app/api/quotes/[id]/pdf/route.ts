import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

function safeJson(value: any, fallback: any) {
  if (!value) return fallback;
  try { return typeof value === "string" ? JSON.parse(value) : value; } catch { return fallback; }
}

function money(value: number) {
  return `PHP ${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const quote: any = db.prepare(`SELECT q.*, u.name AS account_name, u.email AS account_email FROM quotes q JOIN users u ON q.customer_id = u.id WHERE q.id = ?`).get(context.params.id);
  if (!quote) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  if (session.user.role !== "admin" && quote.customer_id !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = safeJson(quote.items, []);
  const services = safeJson(quote.services, []);
  const project = safeJson(quote.project_details, {});
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const finished = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fillColor("#3b146d").fontSize(22).font("Helvetica-Bold").text("Merica House of Rocks");
  doc.fillColor("#555555").fontSize(10).font("Helvetica").text("Quotation & Material Estimate");
  doc.moveDown(1.5);
  doc.fillColor("#111111").fontSize(16).font("Helvetica-Bold").text(`QUOTATION ${quote.quote_number}`);
  doc.fontSize(10).font("Helvetica").text(`Created: ${quote.created_at}`).text(`Status: ${(quote.workflow_status || quote.status || "pending").replace(/_/g, " ")}`);
  doc.moveDown();

  doc.font("Helvetica-Bold").text("Customer");
  doc.font("Helvetica").text(quote.customer_name || quote.account_name || "Customer").text(quote.customer_email || quote.account_email || "").text(quote.customer_phone || "");
  doc.moveDown();
  doc.font("Helvetica-Bold").text("Project");
  doc.font("Helvetica").text(`Area: ${quote.area_sqm ? `${quote.area_sqm} m²` : "Not specified"}`).text(`Location: ${quote.project_location || project.deliveryCity || "Not specified"}`).text(`Project type: ${project.projectType || "Not specified"}`).text(`Timeline: ${quote.timeline || project.timeline || "Not specified"}`);
  doc.moveDown();

  doc.font("Helvetica-Bold").text("Materials");
  doc.moveDown(0.3);
  for (const item of items) {
    doc.font("Helvetica").text(`${item.name || item.productName || "Material"} — ${item.quantity || 0} ${item.unit || "unit"} × ${money(item.estimatedUnitPrice || item.unitPrice || 0)} = ${money(item.totalPrice || 0)}`);
  }
  if (!items.length) doc.font("Helvetica").text("No material items recorded.");
  doc.moveDown();

  if (services.length) {
    doc.font("Helvetica-Bold").text("Services");
    doc.moveDown(0.3);
    for (const service of services) doc.font("Helvetica").text(`${service.name || "Service"} — ${money(service.total || service.price || 0)}`);
    doc.moveDown();
  }

  doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(0.6);
  doc.font("Helvetica").text(`Materials: ${money(quote.material_total)}`, { align: "right" });
  doc.text(`Delivery: ${money(quote.delivery_fee)}`, { align: "right" });
  doc.text(`Services: ${money(quote.service_total)}`, { align: "right" });
  doc.text(`Other charges: ${money(quote.other_charges)}`, { align: "right" });
  doc.text(`Discount: -${money(quote.discount)}`, { align: "right" });
  doc.font("Helvetica-Bold").fontSize(14).text(`Estimated total: ${money(quote.total)}`, { align: "right" });
  doc.moveDown(1.2);
  doc.font("Helvetica-Bold").fontSize(10).text("Estimate disclaimer");
  doc.font("Helvetica").fontSize(9).fillColor("#555555").text(quote.estimate_disclaimer || "This quotation is an estimate based on the information provided. Final quantity, delivery charges, material requirements, and pricing may be confirmed by our team after reviewing your project.", { width: 500 });
  if (quote.notes) {
    doc.moveDown();
    doc.fillColor("#111111").font("Helvetica-Bold").fontSize(10).text("Notes");
    doc.font("Helvetica").fillColor("#555555").text(quote.notes);
  }
  doc.end();

  const pdf = await finished;
  return new NextResponse(pdf as any, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quote_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
