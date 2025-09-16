package br.ucs.webalgo.middleware.application.port.in.solution;

import br.ucs.webalgo.middleware.application.port.in.solution.dto.*;
import reactor.core.publisher.Mono;

public interface SolutionUseCase {

    Mono<FetchSolutionResult> fetchSolutionData(FetchSolutionCommand command);

    Mono<CreateSolutionResult> createSolution(CreateSolutionCommand command);

    Mono<SaveSolutionResult> saveSolution(SaveSolutionCommand command);
}
