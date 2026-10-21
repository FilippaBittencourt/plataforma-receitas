package br.com.cookie.api.comum;

import org.springframework.http.HttpStatus;

/** Erro de regra de negócio que vira uma resposta HTTP com a mensagem para o usuário. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String mensagem) {
        super(mensagem);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static ApiException naoEncontrado(String mensagem) {
        return new ApiException(HttpStatus.NOT_FOUND, mensagem);
    }

    public static ApiException conflito(String mensagem) {
        return new ApiException(HttpStatus.CONFLICT, mensagem);
    }

    public static ApiException proibido(String mensagem) {
        return new ApiException(HttpStatus.FORBIDDEN, mensagem);
    }

    public static ApiException invalido(String mensagem) {
        return new ApiException(HttpStatus.BAD_REQUEST, mensagem);
    }

    public static ApiException naoAutorizado(String mensagem) {
        return new ApiException(HttpStatus.UNAUTHORIZED, mensagem);
    }
}
