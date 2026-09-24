package com.halalcms.certificateservice.service;

import com.halalcms.certificateservice.model.BatchCertificateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
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
    private static final float MARGIN = 40;
    private static final float Y_START = 750;
    private static final float LINE_HEIGHT = 15;

    public byte[] generateCertificatePdf(BatchCertificateRequest request) {
        try {
            PDDocument document = new PDDocument();
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDPageContentStream contentStream = new PDPageContentStream(document, page);

            // Generate QR code
            BufferedImage qrImage = generateQRCode(request);

            // Build certificate content
            float yPosition = Y_START;
            yPosition = addHeader(contentStream, page, yPosition);
            yPosition = addCertificateNumber(contentStream, page, yPosition, request);
            yPosition = addProducerInformation(contentStream, page, yPosition, request);

            if (request.getImporterName() != null) {
                yPosition = addImporterInformation(contentStream, page, yPosition, request);
            }

            if (request.getExporterName() != null) {
                yPosition = addExporterInformation(contentStream, page, yPosition, request);
            }

            yPosition = addShipmentDetails(contentStream, page, yPosition, request);
            yPosition = addProductsTable(contentStream, page, yPosition, request);
            yPosition = addFeeInformation(contentStream, page, yPosition, request);
            yPosition = addQRCodeAndFooter(contentStream, page, yPosition, request, qrImage, document);

            contentStream.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
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

    private float addHeader(PDPageContentStream contentStream, PDPage page, float yPosition) throws IOException {
        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 24);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN + 150, yPosition);
        contentStream.showText("BATCH CERTIFICATE");
        contentStream.endText();

        yPosition -= LINE_HEIGHT * 1.5f;

        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 12);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN + 100, yPosition);
        contentStream.showText("Halal Slaughtering & Quality Control Certificate");
        contentStream.endText();

        return yPosition - LINE_HEIGHT * 2;
    }

    private float addCertificateNumber(PDPageContentStream contentStream, PDPage page, float yPosition, BatchCertificateRequest request) throws IOException {
        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 11);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText("Certificate Number: " + request.getCertificateNumber());
        contentStream.endText();

        yPosition -= LINE_HEIGHT;

        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 11);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText("Request Number: " + request.getRequestNumber());
        contentStream.endText();

        yPosition -= LINE_HEIGHT;

        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText("Issue Date: " + request.getApprovedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy")));
        contentStream.endText();

        return yPosition - LINE_HEIGHT * 1.5f;
    }

    private float addProducerInformation(PDPageContentStream contentStream, PDPage page, float yPosition, BatchCertificateRequest request) throws IOException {
        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 12);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText("PRODUCER INFORMATION");
        contentStream.endText();

        yPosition -= LINE_HEIGHT * 1.5f;

        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 10);
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Producer Name:", request.getProducerName());
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Phone:", request.getProducerPhone() != null ? request.getProducerPhone() : "-");
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Email:", request.getProducerEmail() != null ? request.getProducerEmail() : "-");
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Contact Person:", request.getProducerContact() != null ? request.getProducerContact() : "-");

        return yPosition - LINE_HEIGHT;
    }

    private float addImporterInformation(PDPageContentStream contentStream, PDPage page, float yPosition, BatchCertificateRequest request) throws IOException {
        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 12);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText("IMPORTER INFORMATION");
        contentStream.endText();

        yPosition -= LINE_HEIGHT * 1.5f;

        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 10);
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Importer Name:", request.getImporterName());
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Country:", request.getImporterCountry() != null ? request.getImporterCountry() : "-");
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Contact:", request.getImporterContact() != null ? request.getImporterContact() : "-");

        return yPosition - LINE_HEIGHT;
    }

    private float addExporterInformation(PDPageContentStream contentStream, PDPage page, float yPosition, BatchCertificateRequest request) throws IOException {
        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 12);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText("EXPORTER INFORMATION");
        contentStream.endText();

        yPosition -= LINE_HEIGHT * 1.5f;

        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 10);
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Exporter Name:", request.getExporterName());
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Country:", request.getExporterCountry() != null ? request.getExporterCountry() : "-");
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Contact:", request.getExporterContact() != null ? request.getExporterContact() : "-");

        return yPosition - LINE_HEIGHT;
    }

    private float addShipmentDetails(PDPageContentStream contentStream, PDPage page, float yPosition, BatchCertificateRequest request) throws IOException {
        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 12);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText("SHIPMENT DETAILS");
        contentStream.endText();

        yPosition -= LINE_HEIGHT * 1.5f;

        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 10);
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Shipment Date:", request.getShipmentDate().toString());
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Shipment Reference:", request.getShipmentReference() != null ? request.getShipmentReference() : "-");
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Origin Country:", request.getOriginCountry());
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Destination Country:", request.getDestinationCountry());

        return yPosition - LINE_HEIGHT;
    }

    private float addProductsTable(PDPageContentStream contentStream, PDPage page, float yPosition, BatchCertificateRequest request) throws IOException {
        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 12);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText("PRODUCTS");
        contentStream.endText();

        yPosition -= LINE_HEIGHT * 1.5f;

        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 10);
        float col1 = MARGIN;
        float col2 = MARGIN + 100;
        float col3 = MARGIN + 250;
        float col4 = MARGIN + 350;

        contentStream.beginText();
        contentStream.newLineAtOffset(col1, yPosition);
        contentStream.showText("SKU");
        contentStream.newLineAtOffset(col2 - col1, 0);
        contentStream.showText("Product Name");
        contentStream.newLineAtOffset(col3 - col2, 0);
        contentStream.showText("Weight (kg)");
        contentStream.newLineAtOffset(col4 - col3, 0);
        contentStream.showText("Unit");
        contentStream.endText();

        yPosition -= LINE_HEIGHT;

        contentStream.beginText();
        contentStream.newLineAtOffset(col1, yPosition);
        contentStream.showText(request.getRequestNumber());
        contentStream.newLineAtOffset(col2 - col1, 0);
        contentStream.showText("Halal Shipment");
        contentStream.newLineAtOffset(col3 - col2, 0);
        contentStream.showText(request.getTotalWeightKg().toString());
        contentStream.newLineAtOffset(col4 - col3, 0);
        contentStream.showText("kg");
        contentStream.endText();

        return yPosition - LINE_HEIGHT * 1.5f;
    }

    private float addFeeInformation(PDPageContentStream contentStream, PDPage page, float yPosition, BatchCertificateRequest request) throws IOException {
        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA_BOLD, 12);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText("FEE INFORMATION");
        contentStream.endText();

        yPosition -= LINE_HEIGHT * 1.5f;

        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 10);
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Total Weight:", request.getTotalWeightKg() + " kg");
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Unit Price:", request.getCurrency() + " " + request.getUnitPricePerKg() + "/kg");
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Total Fee:", request.getCurrency() + " " + request.getTotalFee());
        yPosition = addTableRow(contentStream, MARGIN, yPosition, "Payment Status:", request.getPaymentStatus());

        return yPosition - LINE_HEIGHT;
    }

    private float addQRCodeAndFooter(PDPageContentStream contentStream, PDPage page, float yPosition, BatchCertificateRequest request, BufferedImage qrImage, PDDocument document) throws IOException {
        contentStream.setFont(org.apache.pdfbox.pdmodel.font.PDType1Font.HELVETICA, 9);
        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText("This certificate verifies that the shipment has been inspected and approved as per Halal requirements.");
        contentStream.endText();

        yPosition -= LINE_HEIGHT;

        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText("Approved By: " + (request.getApprovedBy() != null ? request.getApprovedBy() : "HalalCMS Administrator"));
        contentStream.endText();

        yPosition -= LINE_HEIGHT;

        contentStream.beginText();
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText("Verification URL: https://halal-cms.example.com/verify/" + request.getCertificateNumber());
        contentStream.endText();

        return yPosition - LINE_HEIGHT;
    }

    private float addTableRow(PDPageContentStream contentStream, float x, float y, String label, String value) throws IOException {
        contentStream.beginText();
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(label + " " + value);
        contentStream.endText();
        return y - LINE_HEIGHT;
    }
}
