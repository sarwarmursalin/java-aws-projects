package com.mursalin.document.repository;

import com.mursalin.document.model.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    @Query(value = "SELECT DISTINCT d FROM Document d LEFT JOIN FETCH d.tags",
            countQuery = "SELECT COUNT(d) FROM Document d")
    Page<Document> findAllFetchTags(Pageable pageable);
}
