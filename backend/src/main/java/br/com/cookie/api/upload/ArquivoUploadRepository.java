package br.com.cookie.api.upload;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ArquivoUploadRepository extends JpaRepository<ArquivoUpload, Long> {
    long countByUsuarioId(Integer idUsuario);
    @Query("select coalesce(sum(a.tamanhoBytes), 0) from ArquivoUpload a where a.usuario.id = :idUsuario")
    long totalBytesUsuario(@Param("idUsuario") Integer idUsuario);
    @Query("select coalesce(sum(a.tamanhoBytes), 0) from ArquivoUpload a")
    long totalBytes();
    Optional<ArquivoUpload> findByNomeArquivoAndUsuarioId(String nomeArquivo, Integer idUsuario);
    boolean existsByNomeArquivo(String nomeArquivo);
    List<ArquivoUpload> findTop500ByIdGreaterThanAndCriadoEmBeforeOrderByIdAsc(Long id, Instant antes);
}
