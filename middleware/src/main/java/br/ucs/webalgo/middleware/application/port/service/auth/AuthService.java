package br.ucs.webalgo.middleware.application.port.service.auth;

import br.ucs.webalgo.middleware.application.port.in.auth.AuthUseCase;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.*;
import br.ucs.webalgo.middleware.application.port.out.auth.AuthenticationPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class AuthService implements AuthUseCase {

    private final AuthenticationPort authenticationPort;

    public AuthService(AuthenticationPort authenticationPort) {
        this.authenticationPort = authenticationPort;
    }

    @Override
    public Mono<LoginResult> login(LoginCommand command) {
        return authenticationPort.authenticate(command);
    }

    @Override
    public Mono<LogoutResult> logout(LogoutCommand command) {
        return authenticationPort.invalidateSession(command);
    }

    @Override
    public Mono<SignUpResult> register(SignUpCommand command) {
        return authenticationPort.register(command);
    }

    @Override
    public Mono<ChangePasswordResult> changePassword(ChangePasswordCommand command) {
        return authenticationPort.changePassword(command);
    }
}