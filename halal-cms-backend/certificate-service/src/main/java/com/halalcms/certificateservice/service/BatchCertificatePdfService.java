package com.halalcms.certificateservice.service;

import com.halalcms.certificateservice.model.BatchCertificateRequest;
import com.halalcms.certificateservice.model.BatchCertificateTemplate;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchCertificatePdfService {

    private final QRCodeService qrCodeService;

    public byte[] generateCertificatePdf(BatchCertificateRequest request) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc, PageSize.A4);

            // Generate QR code
            BufferedImage qrImage = generateQRCode(request);

            // Build certificate content
            buildCertificateContent(document, request, qrImage);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF for batch request {}", request.getRequestNumber(), e);
            throw new RuntimeException("Failed to generate certificate PDF", e);
        }
    }

    private BufferedImage generateQRCode(BatchCertificateRequest request) {
        String qrData = qrCodeService.generateQRCodeData(
                request.getCertificateNumber(),
                request.getRequestNumber(),
                request.getCompanyId(),
                request.getProducerName(),
                request.getShipmentDate().toString(),
                request.getTotalWeightKg().toString()
        );
        return qrCodeService.generateQRCodeImage(qrData);
    }

    private void buildCertificateContent(Document document, BatchCertificateRequest request, BufferedImage qrImage)
            throws IOException {

        // Header
        addHeader(document, request);

        // Certificate Number
        addCertificateNumber(document, request);

        // Producer Information
        addProducerInformation(document, request);

        // Importer/Exporter Information
        if (request.getImporterName() != null) {
            addImporterInformation(document, request);
        }

        if (request.getExporterName() != null) {
            addExporterInformation(document, request);
        }

        // Shipment Details
        addShipmentDetails(document, request);

        // Products Table
        addProductsTable(document, request);

        // Fee Information
        addFeeInformation(document, request);

        // QR Code and Footer
        addQRCodeAndFooter(document, qrImage, request);
    }

    private void addHeader(Document document, BatchCertificateRequest request) {
        Paragraph header = new Paragraph("BATCH CERTIFICATE")
                .setFontSize(24)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER);
        document.add(header);

        Paragraph subheader = new Paragraph("Halal Slaughtering & Quality Control Certificate")
                .setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(subheader);

        document.add(new Paragraph("\n"));
    }

    private void addCertificateNumber(Document document, BatchCertificateRequest request) {
        Paragraph cert = new Paragraph()
                .add("Certificate Number: ")
                .add(request.getCertificateNumber())
                .setBold()
                .setFontSize(11);
        document.add(cert);

        Paragraph req = new Paragraph()
                .add("Request Number: ")
                .add(request.getRequestNumber())
                .setFontSize(11);
        document.add(req);

        Paragraph date = new Paragraph()
                .add("Issue Date: ")
                .add(request.getApprovedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy")))
                .setFontSize(11);
        document.add(date);

        document.add(new Paragraph("\n"));
    }

    private void addProducerInformation(Document document, BatchCertificateRequest request) {
        Paragraph heading = new Paragraph("PRODUCER INFORMATION")
                .setBold()
                .setFontSize(12)
                .setUnderline();
        document.add(heading);

        Table table = new Table(2);
        table.addCell("Producer Name");
        table.addCell(request.getProducerName());
        table.addCell("Phone");
        table.addCell(request.getProducerPhone() != null ? request.getProducerPhone() : "-");
        table.addCell("Email");
        table.addCell(request.getProducerEmail() != null ? request.getProducerEmail() : "-");
        table.addCell("Contact Person");
        table.addCell(request.getProducerContact() != null ? request.getProducerContact() : "-");

        document.add(table);
        document.add(new Paragraph("\n"));
    }

    private void addImporterInformation(Document document, BatchCertificateRequest request) {
        Paragraph heading = new Paragraph("IMPORTER INFORMATION")
                .setBold()
                .setFontSize(12)
                .setUnderline();
        document.add(heading);

        Table table = new Table(2);
        table.addCell("Importer Name");
        table.addCell(request.getImporterName());
        table.addCell("Country");
        table.addCell(request.getImporterCountry() != null ? request.getImporterCountry() : "-");
        table.addCell("Contact");
        table.addCell(request.getImporterContact() != null ? request.getImporterContact() : "-");

        document.add(table);
        document.add(new Paragraph("\n"));
    }

    private void addExporterInformation(Document document, BatchCertificateRequest request) {
        Paragraph heading = new Paragraph("EXPORTER INFORMATION")
                .setBold()
                .setFontSize(12)
                .setUnderline();
        document.add(heading);

        Table table = new Table(2);
        table.addCell("Exporter Name");
        table.addCell(request.getExporterName());
        table.addCell("Country");
        table.addCell(request.getExporterCountry() != null ? request.getExporterCountry() : "-");
        table.addCell("Contact");
        table.addCell(request.getExporterContact() != null ? request.getExporterContact() : "-");

        document.add(table);
        document.add(new Paragraph("\n"));
    }

    private void addShipmentDetails(Document document, BatchCertificateRequest request) {
        Paragraph heading = new Paragraph("SHIPMENT DETAILS")
                .setBold()
                .setFontSize(12)
                .setUnderline();
        document.add(heading);

        Table table = new Table(2);
        table.addCell("Shipment Date");
        table.addCell(request.getShipmentDate().toString());
        table.addCell("Shipment Reference");
        table.addCell(request.getShipmentReference() != null ? request.getShipmentReference() : "-");
        table.addCell("Origin Country");
        table.addCell(request.getOriginCountry());
        table.addCell("Destination Country");
        table.addCell(request.getDestinationCountry());

        document.add(table);
        document.add(new Paragraph("\n"));
    }

    private void addProductsTable(Document document, BatchCertificateRequest request) {
        Paragraph heading = new Paragraph("PRODUCTS")
                .setBold()
                .setFontSize(12)
                .setUnderline();
        document.add(heading);

        Table table = new Table(4);
        table.addCell("SKU");
        table.addCell("Product Name");
        table.addCell("Weight (kg)");
        table.addCell("Unit");

        // Parse products JSON - simplified for now
        table.addCell(request.getRequestNumber());
        table.addCell("Halal Shipment");
        table.addCell(request.getTotalWeightKg().toString());
        table.addCell("kg");

        document.add(table);
        document.add(new Paragraph("\n"));
    }

    private void addFeeInformation(Document document, BatchCertificateRequest request) {
        Paragraph heading = new Paragraph("FEE INFORMATION")
                .setBold()
                .setFontSize(12)
                .setUnderline();
        document.add(heading);

        Table table = new Table(2);
        table.addCell("Total Weight");
        table.addCell(request.getTotalWeightKg() + " kg");
        table.addCell("Unit Price");
        table.addCell(request.getCurrency() + " " + request.getUnitPricePerKg() + "/kg");
        table.addCell("Total Fee");
        table.addCell(request.getCurrency() + " " + request.getTotalFee());
        table.addCell("Payment Status");
        table.addCell(request.getPaymentStatus());

        document.add(table);
        document.add(new Paragraph("\n"));
    }

    private void addQRCodeAndFooter(Document document, BufferedImage qrImage, BatchCertificateRequest request)
            throws IOException {

        Paragraph footer = new Paragraph()
                .add("This certificate verifies that the shipment has been inspected and approved as per Halal requirements.\n")
                .add("QR Code: Scan to verify certificate details.\n")
                .add("Approved By: ")
                .add(request.getApprovedBy() != null ? request.getApprovedBy() : "HalalCMS Administrator")
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER);

        document.add(footer);
        document.add(new Paragraph("\n"));
        document.add(new Paragraph("Verification URL: https://halal-cms.example.com/verify/" + request.getCertificateNumber())
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER));
    }
}
