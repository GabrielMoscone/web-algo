package br.ucs.webalgo.middleware.application.port.in.solution;

import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionCommand;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionResult;
import reactor.core.publisher.Mono;

public interface SolutionUseCase {

    Mono<FetchSolutionResult> fetchSolutionData(FetchSolutionCommand command);
}
