package com.halalcms.inspectionservice.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Component
@Slf4j
public class QRCodeGenerator {

    public String generateQRCode(String certificateNumber, String certificateUrl, int width, int height) throws WriterException, IOException {
        log.info("Generating QR code for certificate: {}", certificateNumber);

        String qrContent = certificateUrl + "?cert=" + certificateNumber;
        MultiFormatWriter writer = new MultiFormatWriter();

        try {
            BitMatrix bitMatrix = writer.encode(qrContent, BarcodeFormat.QR_CODE, width, height);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

            byte[] imageBytes = outputStream.toByteArray();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            log.info("QR code generated successfully for certificate: {}", certificateNumber);
            return "data:image/png;base64," + base64Image;
        } catch (WriterException | IOException e) {
            log.error("Failed to generate QR code for certificate: {}", certificateNumber, e);
            throw e;
        }
    }

    public String generateQRCode(String data) throws WriterException, IOException {
        return generateQRCode(data, "https://halalcms.com/verify", 200, 200);
    }
}
