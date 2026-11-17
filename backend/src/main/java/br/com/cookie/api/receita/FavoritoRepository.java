package br.com.cookie.api.receita;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoritoRepository extends JpaRepository<Favorito, FavoritoId> {

    List<Favorito> findByUsuarioIdOrderByDataFavoritoDesc(Integer idUsuario);
}
