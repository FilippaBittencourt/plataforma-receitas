package br.com.cookie.api.moderacao;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import br.com.cookie.api.usuario.Usuario;
import java.util.Optional;

public interface DenunciaRepository extends JpaRepository<Denuncia, Integer> {

    @EntityGraph(attributePaths = {"denunciante", "denunciado", "comentario"})
    Page<Denuncia> findByStatusOrderByDataDenunciaDesc(StatusDenuncia status, Pageable pageable);

    long countByStatus(StatusDenuncia status);

    @Query(value = "select u.id_usuario as id, u.nome as nome, u.nome_usuario as \"nomeUsuario\", "
            + "u.status as status, count(d.id_denuncia) as \"denunciasAbertas\", "
            + "(select d2.motivo from denuncia d2 where d2.id_usuario_denunciado = u.id_usuario "
            + "and d2.status = 'ABERTA' order by d2.data_denuncia desc, d2.id_denuncia desc limit 1) as \"ultimoMotivo\" "
            + "from denuncia d join usuario u on u.id_usuario = d.id_usuario_denunciado "
            + "where d.status = 'ABERTA' and d.id_usuario_denunciado is not null "
            + "group by u.id_usuario, u.nome, u.nome_usuario, u.status "
            + "order by count(d.id_denuncia) desc, u.id_usuario asc",
            countQuery = "select count(distinct d.id_usuario_denunciado) from denuncia d "
                    + "where d.status = 'ABERTA' and d.id_usuario_denunciado is not null",
            nativeQuery = true)
    Page<UsuarioDenunciadoProjection> usuariosComDenuncias(Pageable pageable);

    interface UsuarioDenunciadoProjection {
        Integer getId();

        String getNome();

        String getNomeUsuario();

        String getStatus();

        long getDenunciasAbertas();

        String getUltimoMotivo();
    }

    long countByStatusAndDenunciadoId(StatusDenuncia status, Integer idUsuario);

    Optional<Denuncia> findFirstByStatusAndDenunciadoIdOrderByDataDenunciaDesc(StatusDenuncia status,
            Integer idUsuario);

    @Modifying
    @Query("update Denuncia d set d.nomeDenunciante = 'Conta excluída', "
            + "d.nomeUsuarioDenunciante = 'conta_excluida' where d.denunciante.id = :usuarioId")
    int anonimizarDenunciante(@Param("usuarioId") Integer usuarioId);

    @Modifying
    @Query("update Denuncia d set d.nomeDenunciado = 'Conta excluída', "
            + "d.nomeUsuarioDenunciado = 'conta_excluida' where d.denunciado.id = :usuarioId")
    int anonimizarDenunciado(@Param("usuarioId") Integer usuarioId);
}
