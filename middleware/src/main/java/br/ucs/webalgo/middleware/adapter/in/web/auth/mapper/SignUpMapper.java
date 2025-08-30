package br.ucs.webalgo.middleware.adapter.in.web.auth.mapper;

import br.ucs.webalgo.middleware.adapter.in.web.auth.dto.SignUpRequest;
import br.ucs.webalgo.middleware.adapter.in.web.auth.dto.SignUpResponse;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.SignUpCommand;
import br.ucs.webalgo.middleware.application.port.in.auth.dto.SignUpResult;
import org.springframework.stereotype.Component;

@Component
public class SignUpMapper {

    public SignUpCommand toCommand(SignUpRequest req) {
        return new SignUpCommand(req.getFirstName(), req.getSecondName(), req.getUsername(), req.getPassword(), req.getEmail(),
                req.getObs(), req.getCity(), req.getState(), req.getGender());
    }


    public SignUpResponse toResponse(SignUpResult result) {
        return new SignUpResponse(result.message());
    }
}
