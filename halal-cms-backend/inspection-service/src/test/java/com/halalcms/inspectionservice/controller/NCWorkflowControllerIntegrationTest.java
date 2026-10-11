package com.halalcms.inspectionservice.controller;

import com.halalcms.inspectionservice.dto.NCWorkflowDto;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class NCWorkflowControllerIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Test
    void savedNcFindingAppearsInApplicationNcWorkflowList() {
        long applicationId = 987654L;
        String questionId = "test-q-1";

        NCWorkflowDto.SaveFindingRequest request = NCWorkflowDto.SaveFindingRequest.builder()
                .questionId(questionId)
                .questionText("Integration test audit question")
                .category("manufacturing")
                .description("Integration test NC description")
                .severity("HIGH")
                .auditorComment("Created by integration test")
                .build();

        ResponseEntity<String> saveResponse = restTemplate.exchange(
                "/api/nc/application/{applicationId}/findings",
                HttpMethod.POST,
                new HttpEntity<>(request, authHeaders()),
                String.class,
                applicationId
        );

        assertThat(saveResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<List<NCWorkflowDto.NCWorkflowStatusResponse>> listResponse = restTemplate.exchange(
                "/api/nc/application/{applicationId}",
                HttpMethod.GET,
                new HttpEntity<>(authHeaders()),
                new ParameterizedTypeReference<>() {},
                applicationId
        );

        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listResponse.getBody())
                .isNotNull()
                .anySatisfy(nc -> {
                    assertThat(nc.getQuestionText()).isEqualTo("Integration test audit question");
                    assertThat(nc.getDescription()).isEqualTo("Integration test NC description");
                    assertThat(nc.getCategory()).isEqualTo("manufacturing");
                    assertThat(nc.getCurrentStatus()).isEqualTo("PENDING_CUSTOMER_ACTION");
                });
    }

    private HttpHeaders authHeaders() {
        String token = Jwts.builder()
                .subject("123")
                .claim("role", "OFFICE_ADMIN")
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                .compact();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }
}
