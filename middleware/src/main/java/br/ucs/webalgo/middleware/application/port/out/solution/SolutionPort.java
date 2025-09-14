package br.ucs.webalgo.middleware.application.port.out.solution;

import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionCommand;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionResult;
import reactor.core.publisher.Mono;

public interface SolutionPort {
    Mono<FetchSolutionResult> fetchSolutionData(FetchSolutionCommand command);
}
