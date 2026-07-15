package com.mursalin.document.repository;

import com.mursalin.document.model.Document;
import com.mursalin.document.model.Tag;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE;

@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@Testcontainers
class DocumentRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void hibernateStatistics(DynamicPropertyRegistry registry) {
        registry.add("spring.jpa.properties.hibernate.generate_statistics", () -> "true");
    }

    @Autowired
    private DocumentRepository repository;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private EntityManager entityManager;

    private Statistics statistics() {
        return entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
    }

    private final Map<String, Tag> tagPool = new HashMap<>();

    private void saveDocumentWithTags(String title, String... tagNames) {
        Document document = new Document(title, "golam", "pdf", 100L, LocalDateTime.now());
        for (String tagName : tagNames) {
            document.getTags().add(tagPool.computeIfAbsent(tagName, Tag::new));
        }
        repository.save(document);
    }

    // forces the next query to rebuild fresh, lazily-uninitialized entities from the DB
    private void flushAndDetachEverything() {
        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void savesAndRetrievesDocument() {
        Document document = new Document("resume.pdf", "golam", "pdf", 2048L, LocalDateTime.now());

        Document saved = repository.save(document);

        assertThat(saved.getId()).isNotNull();
        assertThat(repository.findById(saved.getId())).isPresent();
    }

    @Test
    void findAll_appliesPagination() {
        repository.save(new Document("a.pdf", "golam", "pdf", 100L, LocalDateTime.now()));
        repository.save(new Document("b.pdf", "golam", "pdf", 200L, LocalDateTime.now()));
        repository.save(new Document("c.pdf", "golam", "pdf", 300L, LocalDateTime.now()));

        Page<Document> page = repository.findAll(PageRequest.of(0, 2));

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getTotalPages()).isEqualTo(2);
    }

    @Test
    void findAll_causesOneQueryPerDocument_whenTagsAccessedLazily() {
        saveDocumentWithTags("a.pdf", "invoice", "urgent");
        saveDocumentWithTags("b.pdf", "receipt");
        saveDocumentWithTags("c.pdf", "invoice");
        flushAndDetachEverything();
        statistics().clear();

        var documents = repository.findAll();
        documents.forEach(document -> document.getTags().size());

        // 1 query for all documents + 1 more per document to lazily fetch its tags = 4
        assertThat(statistics().getPrepareStatementCount()).isEqualTo(4);
    }

    @Test
    void findAllFetchTags_runsOneQuery_regardlessOfDocumentCount() {
        saveDocumentWithTags("a.pdf", "invoice", "urgent");
        saveDocumentWithTags("b.pdf", "receipt");
        saveDocumentWithTags("c.pdf", "invoice");
        flushAndDetachEverything();
        statistics().clear();

        Page<Document> page = repository.findAllFetchTags(PageRequest.of(0, 3));
        page.getContent().forEach(document -> document.getTags().size());

        // 1 count query + 1 join-fetch query, no matter how many documents come back
        assertThat(statistics().getPrepareStatementCount()).isEqualTo(2);
        assertThat(page.getContent())
                .flatMap(document -> document.getTags().stream().map(Tag::getName).toList())
                .containsExactlyInAnyOrder("invoice", "urgent", "receipt", "invoice");
    }
}
