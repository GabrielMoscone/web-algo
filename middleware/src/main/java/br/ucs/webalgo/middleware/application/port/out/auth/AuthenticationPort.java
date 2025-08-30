package br.ucs.webalgo.middleware.application.port.out.auth;

import br.ucs.webalgo.middleware.application.port.in.auth.dto.*;
import reactor.core.publisher.Mono;

public interface AuthenticationPort {
    Mono<LoginResult> authenticate(LoginCommand command);

    Mono<LogoutResult> invalidateSession(LogoutCommand command);

    Mono<SignUpResult> register(SignUpCommand command);

    Mono<ChangePasswordResult> changePassword(ChangePasswordCommand command);
}
