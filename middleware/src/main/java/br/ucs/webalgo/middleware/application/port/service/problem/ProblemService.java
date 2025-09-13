package br.ucs.webalgo.middleware.application.port.service.problem;

import br.ucs.webalgo.middleware.application.port.in.problem.ProblemUseCase;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.FetchByCodeCommand;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.FetchByCodeResult;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.SearchByKeyCommand;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.SearchByKeyResult;
import br.ucs.webalgo.middleware.application.port.out.problem.ProblemPort;
import br.ucs.webalgo.middleware.shared.util.StringTools;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ProblemService implements ProblemUseCase {

    private final ProblemPort client;

    public ProblemService(ProblemPort client) {
        this.client = client;
    }

    @Override
    public Mono<SearchByKeyResult> searchProblemByKey(SearchByKeyCommand command) {
        if (StringTools.isNullOrEmpty(command.key())) {
            return Mono.error(new IllegalArgumentException("Tipo é obrigatório"));
        }

        if (StringTools.isNullOrEmpty(command.sessionId()) || StringTools.isNullOrEmpty(command.username())) {
            return Mono.error(new IllegalStateException("Cookies de sessão ausentes"));
        }
        return client.searchProblemByKey(command);
    }

    @Override
    public Mono<FetchByCodeResult> fetchProblemData(FetchByCodeCommand command) {
        return client.fetchProblemData(command);
    }
}