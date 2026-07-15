package com.mursalin.document.controller;

import com.mursalin.document.dto.DocumentRequest;
import com.mursalin.document.dto.DocumentResponse;
import com.mursalin.document.model.Document;
import com.mursalin.document.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService service;

    public DocumentController(DocumentService service) {
        this.service = service;
    }

    @GetMapping
    public Page<DocumentResponse> getAll(Pageable pageable) {
        return service.getAll(pageable).map(DocumentResponse::from);
    }

    @GetMapping("/{id}")
    public DocumentResponse getById(@PathVariable Long id) {
        return DocumentResponse.from(service.getById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentResponse create(@Valid @RequestBody DocumentRequest request) {
        Document document = new Document(
                request.title(),
                request.owner(),
                request.fileType(),
                request.fileSizeBytes(),
                LocalDateTime.now()
        );
        return DocumentResponse.from(service.create(document));
    }

    @PutMapping("/{id}")
    public DocumentResponse update(@PathVariable Long id, @Valid @RequestBody DocumentRequest request) {
        Document document = new Document(
                request.title(),
                request.owner(),
                request.fileType(),
                request.fileSizeBytes(),
                null
        );
        return DocumentResponse.from(service.update(id, document));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
