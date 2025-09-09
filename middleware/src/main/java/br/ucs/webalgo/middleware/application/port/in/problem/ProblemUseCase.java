package br.ucs.webalgo.middleware.application.port.in.problem;

import br.ucs.webalgo.middleware.application.port.in.problem.dto.SearchByKeyCommand;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.SearchByKeyResult;
import reactor.core.publisher.Mono;

public interface ProblemUseCase {
    Mono<SearchByKeyResult> searchProblemByKey(SearchByKeyCommand command);
}
