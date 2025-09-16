package br.ucs.webalgo.middleware.adapter.in.web.solution.mapper;

import br.ucs.webalgo.middleware.adapter.in.web.solution.dto.SaveSolutionRequest;
import br.ucs.webalgo.middleware.adapter.in.web.solution.dto.SaveSolutionResponse;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.SaveSolutionCommand;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.SaveSolutionResult;
import org.springframework.stereotype.Component;

@Component
public class SaveSolutionMapper {

    public SaveSolutionCommand toCommand(SaveSolutionRequest req, String sessionId, String username) {
        return new SaveSolutionCommand(
                req.algorithm(),
                req.problemCode(),
                req.cost(),
                req.answer(),
                sessionId,
                username
        );
    }

    public SaveSolutionResponse toResponse(SaveSolutionResult result) {
        return new SaveSolutionResponse(result.status());
    }
}