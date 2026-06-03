import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\EnrollmentImportController::importMethod
 * @see app/Http/Controllers/EnrollmentImportController.php:13
 * @route '/programs/import-enrollments'
 */
export const importMethod = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

importMethod.definition = {
    methods: ["post"],
    url: '/programs/import-enrollments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnrollmentImportController::importMethod
 * @see app/Http/Controllers/EnrollmentImportController.php:13
 * @route '/programs/import-enrollments'
 */
importMethod.url = (options?: RouteQueryOptions) => {
    return importMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnrollmentImportController::importMethod
 * @see app/Http/Controllers/EnrollmentImportController.php:13
 * @route '/programs/import-enrollments'
 */
importMethod.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnrollmentImportController::importMethod
 * @see app/Http/Controllers/EnrollmentImportController.php:13
 * @route '/programs/import-enrollments'
 */
    const importMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: importMethod.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnrollmentImportController::importMethod
 * @see app/Http/Controllers/EnrollmentImportController.php:13
 * @route '/programs/import-enrollments'
 */
        importMethodForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: importMethod.url(options),
            method: 'post',
        })
    
    importMethod.form = importMethodForm
const enrollments = {
    import: Object.assign(importMethod, importMethod),
}

export default enrollments