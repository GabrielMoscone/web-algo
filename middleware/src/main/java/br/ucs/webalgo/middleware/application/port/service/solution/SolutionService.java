package br.ucs.webalgo.middleware.application.port.service.solution;

import br.ucs.webalgo.middleware.application.port.in.solution.SolutionUseCase;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.CreateSolutionCommand;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.CreateSolutionResult;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionCommand;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionResult;
import br.ucs.webalgo.middleware.application.port.out.solution.SolutionPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class SolutionService implements SolutionUseCase {

    private final SolutionPort client;

    public SolutionService(SolutionPort client) {
        this.client = client;
    }

    @Override
    public Mono<FetchSolutionResult> fetchSolutionData(FetchSolutionCommand command) {
        return client.fetchSolutionData(command);
    }

    @Override
    public Mono<CreateSolutionResult> createSolution(CreateSolutionCommand command) {
        return client.createSolution(command);
    }
}
