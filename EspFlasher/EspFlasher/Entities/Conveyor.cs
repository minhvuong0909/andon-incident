using System;
using System.Collections.Generic;

namespace EspFlasher.Entities;

public partial class Conveyor
{
    public int Id { get; set; }

    public int FactoryId { get; set; }

    public string? DeviceId { get; set; }

    public string Name { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();

    public virtual Factory Factory { get; set; } = null!;

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
