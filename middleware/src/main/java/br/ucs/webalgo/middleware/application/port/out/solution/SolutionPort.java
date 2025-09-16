package br.ucs.webalgo.middleware.application.port.out.solution;

import br.ucs.webalgo.middleware.application.port.in.solution.dto.*;
import reactor.core.publisher.Mono;

public interface SolutionPort {
    Mono<FetchSolutionResult> fetchSolutionData(FetchSolutionCommand command);

    Mono<CreateSolutionResult> createSolution(CreateSolutionCommand command);

    Mono<SaveSolutionResult> saveSolution(SaveSolutionCommand command);
}
