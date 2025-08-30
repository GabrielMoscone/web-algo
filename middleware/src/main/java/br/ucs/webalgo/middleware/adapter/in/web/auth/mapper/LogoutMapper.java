package br.ucs.webalgo.middleware.adapter.in.web.auth.mapper;

import br.ucs.webalgo.middleware.adapter.in.web.auth.dto.LogoutRequest;
import br.ucs.webalgo.middleware.adapter.in.web.auth.dto.LogoutResponse;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.LogoutCommand;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.LogoutResult;
import org.springframework.stereotype.Component;

@Component
public class LogoutMapper {

    public LogoutCommand toCommand(LogoutRequest req) {
        return new LogoutCommand(req.getUsername(), req.getSessionId());
    }

    public LogoutResponse toResponse(LogoutResult res) {
        return new LogoutResponse(res.username());
    }
}
