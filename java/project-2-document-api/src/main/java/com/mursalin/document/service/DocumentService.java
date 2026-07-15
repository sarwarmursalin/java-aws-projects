package com.mursalin.document.service;

import com.mursalin.document.exception.DocumentNotFoundException;
import com.mursalin.document.model.Document;
import com.mursalin.document.repository.DocumentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class DocumentService {

    private final DocumentRepository repository;

    public DocumentService(DocumentRepository repository) {
        this.repository = repository;
    }

    public Page<Document> getAll(Pageable pageable) {
        return repository.findAllFetchTags(pageable);
    }

    public Document getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
    }

    public Document create(Document document) {
        return repository.save(document);
    }

    public Document update(Long id, Document updated) {
        Document existing = getById(id);
        existing.setTitle(updated.getTitle());
        existing.setOwner(updated.getOwner());
        existing.setFileType(updated.getFileType());
        existing.setFileSizeBytes(updated.getFileSizeBytes());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}