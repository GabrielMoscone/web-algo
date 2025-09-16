package br.ucs.webalgo.middleware.adapter.in.web.solution.mapper;

import br.ucs.webalgo.middleware.adapter.in.web.solution.dto.CreateSolutionResponse;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.CreateSolutionCommand;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.CreateSolutionResult;
import org.springframework.stereotype.Component;

@Component
public class CreateSolutionMapper {

    public CreateSolutionCommand toCommand(String problemCode, String sessionId, String username) {
        return new CreateSolutionCommand(problemCode, sessionId, username);
    }

    public CreateSolutionResponse toResponse(CreateSolutionResult result) {
        return new CreateSolutionResponse(result.solutionCode());
    }
}
