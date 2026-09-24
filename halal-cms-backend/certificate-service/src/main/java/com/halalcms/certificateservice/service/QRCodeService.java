package com.halalcms.certificateservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class QRCodeService {

    private final ObjectMapper objectMapper;
    private static final int QR_CODE_SIZE = 200;

    public String generateQRCodeData(String certificateNumber, String requestNumber, String companyName,
                                      String producerName, String shipmentDate, String totalWeight) {
        try {
            Map<String, String> data = new HashMap<>();
            data.put("type", "batch-certificate");
            data.put("certificateNumber", certificateNumber);
            data.put("requestNumber", requestNumber);
            data.put("companyName", companyName);
            data.put("producerName", producerName);
            data.put("shipmentDate", shipmentDate);
            data.put("totalWeight", totalWeight);
            data.put("verificationUrl", "https://halal-cms.example.com/verify/" + certificateNumber);

            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            log.error("Failed to generate QR code data", e);
            throw new RuntimeException("Failed to generate QR code data", e);
        }
    }

    public BufferedImage generateQRCodeImage(String data) {
        try {
            MultiFormatWriter writer = new MultiFormatWriter();
            BitMatrix bitMatrix = writer.encode(data, BarcodeFormat.QR_CODE, QR_CODE_SIZE, QR_CODE_SIZE);
            return MatrixToImageWriter.toBufferedImage(bitMatrix);
        } catch (WriterException e) {
            log.error("Failed to generate QR code image", e);
            throw new RuntimeException("Failed to generate QR code image", e);
        }
    }

    public byte[] generateQRCodeImageBytes(String data) {
        try {
            BufferedImage image = generateQRCodeImage(data);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            // Use a simple PNG writer
            return getPngBytes(image);
        } catch (Exception e) {
            log.error("Failed to convert QR code to bytes", e);
            throw new RuntimeException("Failed to convert QR code to bytes", e);
        }
    }

    private byte[] getPngBytes(BufferedImage image) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        // Using ImageIO to write PNG
        javax.imageio.ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }
}
