package br.com.cookie.api.usuario;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    @Query("select u from Usuario u where :termo = '' or "
            + "lower(u.nome) like concat('%', :termo, '%') or "
            + "lower(u.nomeUsuario) like concat('%', :termo, '%') or "
            + "lower(u.email) like concat('%', :termo, '%')")
    Page<Usuario> buscarParaGestao(@Param("termo") String termo, Pageable pageable);

    Optional<Usuario> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Usuario u where u.email = :email")
    Optional<Usuario> findByEmailForUpdate(@Param("email") String email);

    Optional<Usuario> findByNomeUsuario(String nomeUsuario);

    boolean existsByEmail(String email);

    boolean existsByNomeUsuario(String nomeUsuario);

    boolean existsByFotoPerfil(String fotoPerfil);
}
