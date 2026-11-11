package br.com.cookie.api.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;


@Service
public class EmailNotificacaoService {
    private static final Logger log = LoggerFactory.getLogger(EmailNotificacaoService.class);
    private final ObjectProvider<JavaMailSender> mailSender;
    private final boolean emailAtivo;
    private final String origem;
    private final String frontendUrl;

    public EmailNotificacaoService(ObjectProvider<JavaMailSender> mailSender,
            @Value("${app.email.enabled:false}") boolean emailAtivo,
            @Value("${app.email.from:noreply@cookie.local}") String origem,
            @Value("${app.frontend.url:http://localhost:5173}") String frontendUrl) {
        this.mailSender = mailSender;
        this.emailAtivo = emailAtivo; this.origem = origem; this.frontendUrl = frontendUrl;
    }

    public record Atividade(String destino, String nomeDestinatario, String nomeAutor, String tituloReceita,
            Integer idReceita, String tipo) {}

    @Async("emailExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void enviarAtividade(Atividade evento) {
        String assunto = "comentario".equals(evento.tipo()) ? "Novo comentário na sua receita" : "Nova avaliação da sua receita";
        String acao = "comentario".equals(evento.tipo()) ? "comentou" : "avaliou";
        enviar(evento.destino(), assunto, "Olá " + evento.nomeDestinatario() + ",\n\n" + evento.nomeAutor() + " " + acao
                + " sua receita \"" + evento.tituloReceita() + "\".\n\nVeja a receita: "
                + frontendUrl.replaceAll("/$", "") + "/receita/" + evento.idReceita());
    }

    private void enviar(String destino, String assunto, String corpo) {
        if (!emailAtivo) return;
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) { log.warn("SMTP está habilitado, mas não há JavaMailSender configurado."); return; }
        var mensagem = new SimpleMailMessage();
        mensagem.setFrom(origem); mensagem.setTo(destino); mensagem.setSubject(assunto); mensagem.setText(corpo);
        try { sender.send(mensagem); }
        catch (RuntimeException erro) { log.error("Falha ao enviar notificação de e-mail para {}.", destino, erro); }
    }
}
