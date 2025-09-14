package br.ucs.webalgo.middleware.adapter.in.web.solution.mapper;

import br.ucs.webalgo.middleware.adapter.in.web.solution.dto.SolutionDataResponse;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionCommand;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionResult;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SolutionDataMapper {
    public FetchSolutionCommand toCommand(String code, String sessionId, String username) {
        return new FetchSolutionCommand(code, sessionId, username);
    }

    public SolutionDataResponse toResponse(FetchSolutionResult result) {
        List<SolutionDataResponse.SolutionIO> io = result.ioList() == null ? null : result.ioList().stream().map(x -> new SolutionDataResponse.SolutionIO(x.input(), x.output())).toList();
        return new SolutionDataResponse(result.cost(), result.solution(), io);
    }
}
