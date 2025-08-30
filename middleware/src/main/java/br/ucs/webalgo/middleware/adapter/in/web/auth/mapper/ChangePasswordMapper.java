package br.ucs.webalgo.middleware.adapter.in.web.auth.mapper;

import br.ucs.webalgo.middleware.adapter.in.web.auth.dto.ChangePasswordRequest;
import br.ucs.webalgo.middleware.adapter.in.web.auth.dto.ChangePasswordResponse;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.ChangePasswordCommand;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.ChangePasswordResult;
import org.springframework.stereotype.Component;

@Component
public class ChangePasswordMapper {

    public ChangePasswordCommand toCommand(ChangePasswordRequest req) {
        return new ChangePasswordCommand(req.getUsername(), req.getCurrentPassword(), req.getNewPassword(), req.getConfirmPassword());
    }

    public ChangePasswordResponse toResponse(ChangePasswordResult result) {
        return new ChangePasswordResponse(result.message());
    }
}
