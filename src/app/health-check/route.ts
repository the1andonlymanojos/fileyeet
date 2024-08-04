export async function GET() {
    console.log("running here")

    return Response.json({health: "healthy"})

}