package br.ucs.webalgo.middleware.application.port.in.auth;

import br.ucs.webalgo.middleware.application.port.in.auth.dto.*;
import reactor.core.publisher.Mono;

public interface AuthUseCase {

    Mono<LoginResult> login(LoginCommand command);

    Mono<LogoutResult> logout(LogoutCommand command);

    Mono<SignUpResult> register(SignUpCommand command);

    Mono<ChangePasswordResult> changePassword(ChangePasswordCommand command);
}
