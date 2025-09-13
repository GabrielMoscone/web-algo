package br.ucs.webalgo.middleware.application.port.out.problem;

import br.ucs.webalgo.middleware.application.port.in.problem.dto.FetchByCodeCommand;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.FetchByCodeResult;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.SearchByKeyCommand;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.SearchByKeyResult;
import reactor.core.publisher.Mono;

public interface ProblemPort {
    Mono<SearchByKeyResult> searchProblemByKey(SearchByKeyCommand command);

    Mono<FetchByCodeResult> fetchProblemData(FetchByCodeCommand command);
}
