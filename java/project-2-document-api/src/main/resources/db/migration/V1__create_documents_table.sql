CREATE TABLE documents (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    owner           VARCHAR(255) NOT NULL,
    file_type       VARCHAR(50)  NOT NULL,
    file_size_bytes BIGINT       NOT NULL,
    uploaded_at     TIMESTAMP    NOT NULL
);