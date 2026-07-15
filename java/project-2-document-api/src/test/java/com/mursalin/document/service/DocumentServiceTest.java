package com.mursalin.document.service;

import com.mursalin.document.exception.DocumentNotFoundException;
import com.mursalin.document.model.Document;
import com.mursalin.document.repository.DocumentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository repository;

    @InjectMocks
    private DocumentService service;

    @Test
    void getAll_returnsAllDocumentsFromRepository() {
        Document doc = new Document("resume.pdf", "golam", "pdf", 2048L, LocalDateTime.now());
        Pageable pageable = PageRequest.of(0, 10);
        Page<Document> page = new PageImpl<>(List.of(doc), pageable, 1);
        when(repository.findAllFetchTags(pageable)).thenReturn(page);

        Page<Document> result = service.getAll(pageable);

        assertThat(result.getContent()).containsExactly(doc);
    }

    @Test
    void getById_returnsDocument_whenFound() {
        Document doc = new Document("resume.pdf", "golam", "pdf", 2048L, LocalDateTime.now());
        when(repository.findById(1L)).thenReturn(Optional.of(doc));

        Document result = service.getById(1L);

        assertThat(result).isEqualTo(doc);
    }

    @Test
    void getById_throwsDocumentNotFoundException_whenMissing() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(999L))
                .isInstanceOf(DocumentNotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    void create_savesAndReturnsDocument() {
        Document doc = new Document("resume.pdf", "golam", "pdf", 2048L, LocalDateTime.now());
        when(repository.save(doc)).thenReturn(doc);

        Document result = service.create(doc);

        assertThat(result).isEqualTo(doc);
        verify(repository).save(doc);
    }

    @Test
    void update_appliesChangesAndSaves_whenFound() {
        Document existing = new Document("old.pdf", "golam", "pdf", 100L, LocalDateTime.now());
        Document updates = new Document("new.pdf", "sarwar", "docx", 200L, LocalDateTime.now());
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        Document result = service.update(1L, updates);

        assertThat(result.getTitle()).isEqualTo("new.pdf");
        assertThat(result.getOwner()).isEqualTo("sarwar");
        assertThat(result.getFileType()).isEqualTo("docx");
        assertThat(result.getFileSizeBytes()).isEqualTo(200L);
        verify(repository).save(existing);
    }

    @Test
    void update_throwsDocumentNotFoundException_whenMissing() {
        Document updates = new Document("new.pdf", "sarwar", "docx", 200L, LocalDateTime.now());
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(999L, updates))
                .isInstanceOf(DocumentNotFoundException.class);

        verify(repository, never()).save(any());
    }

    @Test
    void delete_callsRepositoryDeleteById() {
        service.delete(1L);

        verify(repository).deleteById(1L);
    }
}
