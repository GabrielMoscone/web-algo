package br.ucs.webalgo.middleware.adapter.in.web.auth.mapper;

import br.ucs.webalgo.middleware.adapter.in.web.auth.dto.LoginRequest;
import br.ucs.webalgo.middleware.adapter.in.web.auth.dto.LoginResponse;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.LoginCommand;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.LoginResult;
import org.springframework.stereotype.Component;

@Component
public class LoginMapper {

    public LoginCommand toCommand(LoginRequest req) {
        return new LoginCommand(req.getUsername(), req.getPassword());
    }

    public LoginResponse toResponseWithoutSession(LoginResult res) {
        return new LoginResponse(res.username());
    }
}
