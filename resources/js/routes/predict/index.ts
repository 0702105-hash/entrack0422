import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\PredictController::run
 * @see app/Http/Controllers/PredictController.php:14
 * @route '/predict'
 */
export const run = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: run.url(options),
    method: 'post',
})

run.definition = {
    methods: ["post"],
    url: '/predict',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PredictController::run
 * @see app/Http/Controllers/PredictController.php:14
 * @route '/predict'
 */
run.url = (options?: RouteQueryOptions) => {
    return run.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PredictController::run
 * @see app/Http/Controllers/PredictController.php:14
 * @route '/predict'
 */
run.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: run.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PredictController::run
 * @see app/Http/Controllers/PredictController.php:14
 * @route '/predict'
 */
    const runForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: run.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PredictController::run
 * @see app/Http/Controllers/PredictController.php:14
 * @route '/predict'
 */
        runForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: run.url(options),
            method: 'post',
        })
    
    run.form = runForm
const predict = {
    run: Object.assign(run, run),
}

export default predict