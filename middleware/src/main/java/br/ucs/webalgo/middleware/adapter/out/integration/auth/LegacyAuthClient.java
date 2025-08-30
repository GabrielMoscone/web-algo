package br.ucs.webalgo.middleware.adapter.out.integration.auth;

import br.ucs.webalgo.middleware.adapter.out.integration.auth.mapper.LegacyAuthMapper;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.*;
import br.ucs.webalgo.middleware.application.port.out.auth.AuthenticationPort;
import br.ucs.webalgo.middleware.domain.exception.InvalidCredentialsException;
import br.ucs.webalgo.middleware.shared.util.ApiMessages;
import br.ucs.webalgo.middleware.shared.util.StringTools;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class LegacyAuthClient implements AuthenticationPort {

    private final WebClient client;
    private final LegacyAuthMapper mapper;

    public LegacyAuthClient(WebClient client, LegacyAuthMapper mapper) {
        this.client = client;
        this.mapper = mapper;
    }

    @Override
    public Mono<LoginResult> authenticate(LoginCommand command) {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("username", command.username());
        form.add("currentPassword", command.password());

        return client.post()
                .uri("/logUsuario")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(form)
                .exchangeToMono(resp -> resp.toEntity(String.class))
                .flatMap(entity -> {
                    String setCookie = entity.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
                    if (StringTools.isNullOrEmpty(setCookie)) {
                        return Mono.error(new InvalidCredentialsException("Credenciais inválidas"));
                    }

                    return Mono.just(mapper.fromLegacyEntity(entity));
                });
    }

    @Override
    public Mono<LogoutResult> invalidateSession(LogoutCommand command) {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("username", "nada");
        form.add("currentPassword", "nada");

        return client.post()
                .uri("/logoutPortal")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .cookies(c -> {
                    if (command.sessionId() != null)
                        c.add("sessionid", command.sessionId());
                    if (command.username() != null)
                        c.add("name", command.username());
                })
                .bodyValue(form)
                .exchangeToMono(resp -> resp.toEntity(String.class))
                .map(entity -> new LogoutResult(command.username()));
    }

    @Override
    public Mono<SignUpResult> register(SignUpCommand command) {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("nome1", command.firstName());
        form.add("nome2", command.secondName());
        form.add("login", command.username());
        form.add("email", command.email());
        form.add("obs", command.obs());
        form.add("sexo", command.gender());
        form.add("cidade", command.city());
        form.add("estado", command.state());
        form.add("senha", command.password());

        return client.post()
                .uri("/cadUserp")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(form)
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(body -> {
                    String msg = extractMessage("respostas", body);
                    if (ApiMessages.isSuccess(msg)) {
                        return Mono.just(new SignUpResult(msg));
                    }

                    return Mono.error(new IllegalStateException(msg));
                });
    }

    @Override
    public Mono<ChangePasswordResult> changePassword(ChangePasswordCommand command) {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("login", command.username());
        form.add("senha1", command.currentPassword());
        form.add("senha2", command.newPassword());
        form.add("senha3", command.confirmPassword());

        return client.post()
                .uri("/alteraSenhap")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(form)
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(body -> {
                    String msg = extractMessage("respostas", body);
                    if (ApiMessages.isSuccess(msg)) {
                        return Mono.just(new ChangePasswordResult(msg));
                    }
                    return Mono.error(new IllegalStateException(msg));
                });
    }

    private String extractMessage(String path, String body) {
        try {
            return new ObjectMapper().readTree(body).path(path).asText(null);
        } catch (Exception e) {
            return null;
        }
    }
}