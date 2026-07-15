package com.mursalin.document.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mursalin.document.dto.DocumentRequest;
import com.mursalin.document.exception.DocumentNotFoundException;
import com.mursalin.document.model.Document;
import com.mursalin.document.service.DocumentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DocumentController.class)
class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DocumentService service;

    @Test
    void getAll_returns200WithDocuments() throws Exception {
        Document doc = new Document("resume.pdf", "golam", "pdf", 2048L, LocalDateTime.now());
        Pageable pageable = PageRequest.of(0, 20);
        Page<Document> page = new PageImpl<>(List.of(doc), pageable, 1);
        when(service.getAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("resume.pdf"));
    }

    @Test
    void getById_returns200_whenFound() throws Exception {
        Document doc = new Document("resume.pdf", "golam", "pdf", 2048L, LocalDateTime.now());
        when(service.getById(1L)).thenReturn(doc);

        mockMvc.perform(get("/api/documents/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("resume.pdf"));
    }

    @Test
    void getById_returns404_whenMissing() throws Exception {
        when(service.getById(999L)).thenThrow(new DocumentNotFoundException(999L));

        mockMvc.perform(get("/api/documents/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Document not found: 999"));
    }

    @Test
    void create_returns201_whenValid() throws Exception {
        DocumentRequest request = new DocumentRequest("resume.pdf", "golam", "pdf", 2048L);
        Document saved = new Document("resume.pdf", "golam", "pdf", 2048L, LocalDateTime.now());
        when(service.create(any(Document.class))).thenReturn(saved);

        mockMvc.perform(post("/api/documents")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("resume.pdf"));
    }

    @Test
    void create_returns400_whenTitleMissing() throws Exception {
        String bodyMissingTitle = """
                {"owner":"golam","fileType":"pdf","fileSizeBytes":2048}
                """;

        mockMvc.perform(post("/api/documents")
                        .contentType("application/json")
                        .content(bodyMissingTitle))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("must not be blank"));
    }

    @Test
    void update_returns200_whenFound() throws Exception {
        DocumentRequest request = new DocumentRequest("new.pdf", "sarwar", "docx", 4096L);
        Document updated = new Document("new.pdf", "sarwar", "docx", 4096L, LocalDateTime.now());
        when(service.update(eq(1L), any(Document.class))).thenReturn(updated);

        mockMvc.perform(put("/api/documents/1")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("new.pdf"));
    }

    @Test
    void delete_returns204() throws Exception {
        mockMvc.perform(delete("/api/documents/1"))
                .andExpect(status().isNoContent());
    }
}
