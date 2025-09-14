package br.ucs.webalgo.middleware.adapter.in.web.solution;

import br.ucs.webalgo.middleware.adapter.in.web.solution.dto.SolutionDataResponse;
import br.ucs.webalgo.middleware.adapter.in.web.solution.mapper.SolutionDataMapper;
import br.ucs.webalgo.middleware.application.port.in.solution.SolutionUseCase;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionCommand;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/web-algo/solutions")
public class SolutionController {

    private final SolutionUseCase solutionUseCase;
    private final SolutionDataMapper solutionDataMapper;

    public SolutionController(SolutionUseCase solutionUseCase, SolutionDataMapper solutionDataMapper) {
        this.solutionUseCase = solutionUseCase;
        this.solutionDataMapper = solutionDataMapper;
    }

    @GetMapping("/{code}/details")
    public Mono<ResponseEntity<SolutionDataResponse>> fetchSolutionDetails(@PathVariable String code,
                                                                           @CookieValue("sessionid") String sessionId,
                                                                           @CookieValue("name") String userName) {

        FetchSolutionCommand command = solutionDataMapper.toCommand(code, sessionId, userName);

        return solutionUseCase.fetchSolutionData(command)
                .map(solutionDataMapper::toResponse)
                .map(ResponseEntity::ok)
                .onErrorResume(IllegalStateException.class, e -> Mono.just(ResponseEntity.status(401).build()))
                .onErrorResume(IllegalArgumentException.class, e -> Mono.just(ResponseEntity.unprocessableEntity().build()));
    }
}
