package br.ucs.webalgo.middleware.adapter.in.web.problem.mapper;

import br.ucs.webalgo.middleware.adapter.in.web.problem.dto.ProblemDataResponse;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.FetchByCodeCommand;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.FetchByCodeResult;
import org.springframework.stereotype.Component;

@Component
public class ProblemDataMapper {
    public FetchByCodeCommand toCommand(String code, String sessionId, String username) {
        return new FetchByCodeCommand(code, sessionId, username);
    }

    public ProblemDataResponse toResponse(FetchByCodeResult result) {
        return new ProblemDataResponse(result.input(), result.output(), result.cost(), result.solutions(), result.ranking(), result.description());
    }
}
